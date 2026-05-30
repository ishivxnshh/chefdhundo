import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/supabase";

export const AUTH_COOKIE_NAME = "chef_auth";
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_REQUEST_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const ADMIN_BOOTSTRAP_PHONE = "+919360804740";
const memoryOtpStore = new Map<
  string,
  { otpHash: string; expiresAt: number; attempts: number; createdAt: number }
>();
let otpStorageMode: "supabase" | "memory" = "supabase";

type UserRole = "basic" | "pro" | "admin";

export type SessionPayload = {
  sub: string;
  phone: string;
  role: UserRole;
  name?: string;
  email?: string | null;
  iat?: number;
  exp?: number;
};

type AuthResult = {
  userId: string | null;
  sessionClaims?: {
    role: UserRole;
    phone: string;
    metadata: { role: UserRole };
    publicMetadata: { role: UserRole };
  };
};

type ClerkCompatUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  imageUrl: string | null;
  emailAddresses: { id: string; emailAddress: string }[];
  primaryEmailAddressId: string;
  primaryEmailAddress: { id: string; emailAddress: string };
  primaryPhoneNumber: { id: string; phoneNumber: string } | null;
  primaryPhoneNumberId: string | null;
  unsafeMetadata: Record<string, never>;
  publicMetadata: { role: UserRole };
  reload: () => Promise<void>;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is missing");
  }
  return new TextEncoder().encode(secret);
}

function getOtpSecret() {
  const secret = process.env.OTP_SECRET;
  if (!secret) {
    throw new Error("OTP_SECRET is missing");
  }
  return secret;
}

export function normalizeIndianPhone(phone: string) {
  const cleaned = String(phone || "").trim().replace(/[^\d+]/g, "");
  if (/^\+91[6-9]\d{9}$/.test(cleaned)) return cleaned;
  if (/^[6-9]\d{9}$/.test(cleaned)) return `+91${cleaned}`;
  return null;
}

export function phoneToSyntheticId(phone: string) {
  return `phone:${phone}`;
}

export function syntheticIdToPhone(id: string | null | undefined) {
  if (!id || !id.startsWith("phone:+91")) return null;
  const phone = id.replace("phone:", "");
  return normalizeIndianPhone(phone);
}

export function createOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashOtp(phone: string, otp: string) {
  return crypto
    .createHmac("sha256", getOtpSecret())
    .update(`${phone}:${otp}`)
    .digest("hex");
}

function isMissingOtpTableError(errorMessage?: string) {
  const message = String(errorMessage || "").toLowerCase();
  return message.includes("public.phone_otps") || message.includes("schema cache");
}

function canRequestOtpInMemory(phone: string) {
  const saved = memoryOtpStore.get(phone);
  if (!saved) return true;
  return Date.now() - saved.createdAt > OTP_REQUEST_COOLDOWN_MS;
}

function saveOtpInMemory(phone: string, otp: string) {
  memoryOtpStore.set(phone, {
    otpHash: hashOtp(phone, otp),
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
    createdAt: Date.now(),
  });
}

function verifyOtpInMemory(phone: string, otp: string) {
  const saved = memoryOtpStore.get(phone);
  if (!saved) return false;

  if (Date.now() > saved.expiresAt || saved.attempts >= OTP_MAX_ATTEMPTS) {
    memoryOtpStore.delete(phone);
    return false;
  }

  const incomingHash = hashOtp(phone, otp);
  if (incomingHash !== saved.otpHash) {
    saved.attempts += 1;
    return false;
  }

  memoryOtpStore.delete(phone);
  return true;
}

async function cleanupOldOtps(phone: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = supabaseAdmin as any;
  await admin
    .from("phone_otps")
    .delete()
    .or(`phone.eq.${phone},expires_at.lt.${new Date().toISOString()}`);
}

export async function canRequestOtp(phone: string) {
  if (otpStorageMode === "memory") {
    return canRequestOtpInMemory(phone);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = supabaseAdmin as any;
  const { data, error } = await admin
    .from("phone_otps")
    .select("created_at")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingOtpTableError(error.message)) {
      otpStorageMode = "memory";
      return canRequestOtpInMemory(phone);
    }
    throw new Error(`OTP table read failed: ${error.message}`);
  }

  if (!data?.created_at) return true;
  return Date.now() - new Date(data.created_at).getTime() > OTP_REQUEST_COOLDOWN_MS;
}

export async function saveOtp(phone: string, otp: string) {
  if (otpStorageMode === "memory") {
    saveOtpInMemory(phone, otp);
    return;
  }
  try {
    await cleanupOldOtps(phone);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isMissingOtpTableError(message)) {
      otpStorageMode = "memory";
      saveOtpInMemory(phone, otp);
      return;
    }
    throw error;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = supabaseAdmin as any;
  const payload = {
    phone,
    otp_hash: hashOtp(phone, otp),
    expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    attempts: 0,
  };
  const { error } = await admin.from("phone_otps").insert(payload);
  if (error) {
    if (isMissingOtpTableError(error.message)) {
      otpStorageMode = "memory";
      saveOtpInMemory(phone, otp);
      return;
    }
    throw new Error(`OTP save failed: ${error.message}`);
  }
}

export async function verifyOtp(phone: string, otp: string) {
  if (otpStorageMode === "memory") {
    return verifyOtpInMemory(phone, otp);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = supabaseAdmin as any;
  const { data, error } = await admin
    .from("phone_otps")
    .select("id, otp_hash, expires_at, attempts")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingOtpTableError(error.message)) {
      otpStorageMode = "memory";
      return verifyOtpInMemory(phone, otp);
    }
    throw new Error(`OTP verify lookup failed: ${error.message}`);
  }
  if (!data) return false;

  const now = Date.now();
  const expiresAt = new Date(data.expires_at).getTime();
  if (now > expiresAt || data.attempts >= OTP_MAX_ATTEMPTS) {
    await admin.from("phone_otps").delete().eq("id", data.id);
    return false;
  }

  const incomingHash = hashOtp(phone, otp);
  if (incomingHash !== data.otp_hash) {
    await admin
      .from("phone_otps")
      .update({ attempts: (data.attempts || 0) + 1 })
      .eq("id", data.id);
    return false;
  }

  await admin.from("phone_otps").delete().eq("id", data.id);
  return true;
}

function splitName(name: string | null | undefined) {
  const trimmed = (name || "").trim();
  if (!trimmed) return { firstName: null, lastName: null };
  const parts = trimmed.split(/\s+/);
  return {
    firstName: parts[0] ?? null,
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : null,
  };
}

function buildFallbackEmail(phone: string) {
  return `${phone.replace("+", "")}@phone.chefdhundo.com`;
}

export async function ensureUserForPhone(phone: string) {
  const syntheticId = phoneToSyntheticId(phone);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = supabaseAdmin as any;

  const { data: existing, error: lookupError } = await admin
    .from("users")
    .select("*")
    .eq("clerk_user_id", syntheticId)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`User lookup failed: ${lookupError.message}`);
  }

  if (existing) {
    if (phone === ADMIN_BOOTSTRAP_PHONE && existing.role !== "admin") {
      const { data: promoted, error: promoteError } = await admin
        .from("users")
        .update({ role: "admin" })
        .eq("id", existing.id)
        .select("*")
        .single();

      if (promoteError) {
        throw new Error(`Admin bootstrap failed: ${promoteError.message}`);
      }
      return promoted;
    }
    return existing;
  }

  const role: UserRole = phone === ADMIN_BOOTSTRAP_PHONE ? "admin" : "basic";
  const email = buildFallbackEmail(phone);

  const { data: created, error: createError } = await admin
    .from("users")
    .insert({
      clerk_user_id: syntheticId,
      name: `User ${phone}`,
      email,
      role,
      chef: "no",
    })
    .select("*")
    .single();

  if (createError) {
    throw new Error(`User create failed: ${createError.message}`);
  }

  return created;
}

export async function createLoginToken(phone: string) {
  const user = await ensureUserForPhone(phone);
  const payload: SessionPayload = {
    sub: user.clerk_user_id,
    phone,
    role: user.role as UserRole,
    name: user.name,
    email: user.email,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getAuthSecret());

  return { token, user };
}

export async function verifyLoginToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const p = payload as SessionPayload;
    if (!p.sub || !p.phone) return null;
    return p;
  } catch {
    return null;
  }
}

export async function auth(): Promise<AuthResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return { userId: null };

  const payload = await verifyLoginToken(token);
  if (!payload) return { userId: null };

  return {
    userId: payload.sub,
    sessionClaims: {
      role: payload.role,
      phone: payload.phone,
      metadata: { role: payload.role },
      publicMetadata: { role: payload.role },
    },
  };
}

export async function getSessionFromCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyLoginToken(token);
}

export async function currentUser(): Promise<ClerkCompatUser | null> {
  const session = await getSessionFromCookie();
  if (!session) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = supabaseAdmin as any;
  const { data: dbUser } = await admin
    .from("users")
    .select("*")
    .eq("clerk_user_id", session.sub)
    .maybeSingle();

  const displayName = dbUser?.name || session.name || `User ${session.phone}`;
  const email = dbUser?.email || session.email || buildFallbackEmail(session.phone);
  const role = (dbUser?.role || session.role) as UserRole;
  const names = splitName(displayName);

  return {
    id: session.sub,
    firstName: names.firstName,
    lastName: names.lastName,
    fullName: displayName,
    imageUrl: dbUser?.photo ?? null,
    emailAddresses: [{ id: "primary", emailAddress: email }],
    primaryEmailAddressId: "primary",
    primaryEmailAddress: { id: "primary", emailAddress: email },
    primaryPhoneNumber: { id: "primary_phone", phoneNumber: session.phone },
    primaryPhoneNumberId: "primary_phone",
    unsafeMetadata: {},
    publicMetadata: { role },
    reload: async () => {},
  };
}

export async function clerkClient() {
  return {
    users: {
      getUser: async (userId: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const admin = supabaseAdmin as any;
        const { data, error } = await admin
          .from("users")
          .select("*")
          .eq("clerk_user_id", userId)
          .maybeSingle();

        if (!data) {
          const phone = syntheticIdToPhone(userId);
          if (!phone) {
            throw new Error(error?.message || "User not found");
          }
          return {
            id: userId,
            firstName: "User",
            lastName: null,
            imageUrl: null,
            primaryEmailAddressId: "primary",
            emailAddresses: [{ id: "primary", emailAddress: buildFallbackEmail(phone) }],
            primaryPhoneNumberId: "primary_phone",
            primaryPhoneNumber: { id: "primary_phone", phoneNumber: phone },
          };
        }

        const phone = syntheticIdToPhone(data.clerk_user_id);
        const nameParts = splitName(data.name);
        return {
          id: data.clerk_user_id,
          firstName: nameParts.firstName,
          lastName: nameParts.lastName,
          imageUrl: data.photo ?? null,
          primaryEmailAddressId: "primary",
          emailAddresses: [{ id: "primary", emailAddress: data.email }],
          primaryPhoneNumberId: phone ? "primary_phone" : null,
          primaryPhoneNumber: phone ? { id: "primary_phone", phoneNumber: phone } : null,
        };
      },
    },
  };
}
