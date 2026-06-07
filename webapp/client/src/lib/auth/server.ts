import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/supabase";
import {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  hashRequestIp,
  normalizeIndianPhone,
  phoneToSyntheticId,
  syntheticIdToPhone,
} from "./core";

export {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  hashRequestIp,
  normalizeIndianPhone,
  phoneToSyntheticId,
  syntheticIdToPhone,
};

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_REQUEST_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_IP_HOURLY_LIMIT = 10;
const OTP_PHONE_DAILY_LIMIT = 10;
const OTP_GLOBAL_DAILY_LIMIT = 500;
const ADMIN_BOOTSTRAP_PHONE = "+919360804740";

type UserRole = "basic" | "pro" | "admin";

export type SessionPayload = {
  sub: string;
  phone: string;
  iat?: number;
  exp?: number;
};

export type MobileAuthUser = {
  id: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  primaryPhoneNumber: { id: string; phoneNumber: string };
  primaryPhoneNumberId: string;
  publicMetadata: { role: UserRole };
  unsafeMetadata: Record<string, never>;
  reload: () => Promise<void>;
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

type MemoryOtp = {
  otpHash: string;
  expiresAt: number;
  attempts: number;
  createdAt: number;
};

const memoryOtpStore = new Map<string, MemoryOtp>();

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is missing");
  return new TextEncoder().encode(secret);
}

function getOtpSecret() {
  const secret = process.env.OTP_SECRET;
  if (!secret) throw new Error("OTP_SECRET is missing");
  return secret;
}

function allowMemoryOtpFallback() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.OTP_ALLOW_MEMORY_FALLBACK === "true"
  );
}

function hashOtp(phone: string, otp: string) {
  return crypto
    .createHmac("sha256", getOtpSecret())
    .update(`${phone}:${otp}`)
    .digest("hex");
}

function isOtpTableUnavailable(errorMessage?: string) {
  const message = String(errorMessage || "").toLowerCase();
  return message.includes("public.phone_otps") || message.includes("schema cache");
}

function handleOtpStorageError(errorMessage: string) {
  if (isOtpTableUnavailable(errorMessage) && allowMemoryOtpFallback()) {
    return "memory" as const;
  }
  throw new Error(`OTP storage unavailable: ${errorMessage}`);
}

export function createOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

export function getRequestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export function getRequestIpHash(request: Request) {
  return hashRequestIp(getRequestIp(request), getOtpSecret());
}

export async function checkOtpRequestAllowed(phone: string, ipHash: string) {
  // Supabase generated types may lag behind staged production migrations.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = supabaseAdmin as any;
  const now = Date.now();
  const hourAgo = new Date(now - 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const [latest, phoneDaily, ipHourly, globalDaily] = await Promise.all([
    admin
      .from("phone_otps")
      .select("created_at")
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("phone_otps")
      .select("id", { count: "exact", head: true })
      .eq("phone", phone)
      .gte("created_at", dayAgo),
    admin
      .from("phone_otps")
      .select("id", { count: "exact", head: true })
      .eq("request_ip_hash", ipHash)
      .gte("created_at", hourAgo),
    admin
      .from("phone_otps")
      .select("id", { count: "exact", head: true })
      .gte("created_at", dayAgo),
  ]);

  for (const result of [latest, phoneDaily, ipHourly, globalDaily]) {
    if (result.error) {
      const mode = handleOtpStorageError(result.error.message);
      if (mode === "memory") {
        const saved = memoryOtpStore.get(phone);
        return {
          allowed: !saved || now - saved.createdAt > OTP_REQUEST_COOLDOWN_MS,
          reason: "cooldown" as const,
        };
      }
    }
  }

  if (
    latest.data?.created_at &&
    now - new Date(latest.data.created_at).getTime() <= OTP_REQUEST_COOLDOWN_MS
  ) {
    return { allowed: false, reason: "cooldown" as const };
  }
  if ((phoneDaily.count || 0) >= OTP_PHONE_DAILY_LIMIT) {
    return { allowed: false, reason: "phone_daily_limit" as const };
  }
  if ((ipHourly.count || 0) >= OTP_IP_HOURLY_LIMIT) {
    return { allowed: false, reason: "ip_hourly_limit" as const };
  }
  if ((globalDaily.count || 0) >= OTP_GLOBAL_DAILY_LIMIT) {
    return { allowed: false, reason: "global_daily_limit" as const };
  }
  return { allowed: true, reason: null };
}

export async function canRequestOtp(phone: string, ipHash = "unknown") {
  return (await checkOtpRequestAllowed(phone, ipHash)).allowed;
}

export async function saveOtp(phone: string, otp: string, ipHash = "unknown") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = supabaseAdmin as any;
  const payload = {
    phone,
    otp_hash: hashOtp(phone, otp),
    expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    attempts: 0,
    request_ip_hash: ipHash,
    provider_status: "pending",
  };
  const { data, error } = await admin
    .from("phone_otps")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    const mode = handleOtpStorageError(error.message);
    if (mode === "memory") {
      memoryOtpStore.set(phone, {
        otpHash: payload.otp_hash,
        expiresAt: Date.now() + OTP_TTL_MS,
        attempts: 0,
        createdAt: Date.now(),
      });
      return null;
    }
  }
  return data?.id || null;
}

export async function updateOtpDelivery(
  id: string | null,
  updates: {
    provider_message_id?: string | null;
    provider_status?: string | null;
    provider_error?: string | null;
    accepted_at?: string | null;
  }
) {
  if (!id) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = supabaseAdmin as any;
  const { error } = await admin.from("phone_otps").update(updates).eq("id", id);
  if (error) throw new Error(`OTP status update failed: ${error.message}`);
}

export async function invalidateOtp(id: string | null, phone: string) {
  if (!id) {
    memoryOtpStore.delete(phone);
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = supabaseAdmin as any;
  const { error } = await admin.from("phone_otps").delete().eq("id", id);
  if (error) throw new Error(`OTP invalidation failed: ${error.message}`);
}

export async function verifyOtp(phone: string, otp: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = supabaseAdmin as any;
  const { data, error } = await admin
    .from("phone_otps")
    .select("id, otp_hash, expires_at, attempts")
    .eq("phone", phone)
    .is("verified_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    const mode = handleOtpStorageError(error.message);
    if (mode === "memory") {
      const saved = memoryOtpStore.get(phone);
      if (!saved || saved.expiresAt < Date.now() || saved.attempts >= OTP_MAX_ATTEMPTS) {
        memoryOtpStore.delete(phone);
        return false;
      }
      if (saved.otpHash !== hashOtp(phone, otp)) {
        saved.attempts += 1;
        return false;
      }
      memoryOtpStore.delete(phone);
      return true;
    }
  }
  if (!data) return false;

  if (
    new Date(data.expires_at).getTime() < Date.now() ||
    data.attempts >= OTP_MAX_ATTEMPTS
  ) {
    return false;
  }
  if (data.otp_hash !== hashOtp(phone, otp)) {
    await admin
      .from("phone_otps")
      .update({ attempts: (data.attempts || 0) + 1 })
      .eq("id", data.id);
    return false;
  }

  await admin
    .from("phone_otps")
    .update({ verified_at: new Date().toISOString(), provider_status: "verified" })
    .eq("id", data.id);
  return true;
}

function isGeneratedPhoneName(name: string | null | undefined, phone: string) {
  const trimmed = (name || "").trim();
  return !trimmed || trimmed === `User ${phone}` || trimmed === "Unknown User";
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] || null,
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : null,
  };
}

export async function ensureUserForPhone(phone: string) {
  const normalized = normalizeIndianPhone(phone);
  if (!normalized) throw new Error("Invalid mobile number");
  const identityId = phoneToSyntheticId(normalized);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = supabaseAdmin as any;

  const { data: existing, error: lookupError } = await admin
    .from("users")
    .select("*")
    .eq("clerk_user_id", identityId)
    .maybeSingle();
  if (lookupError) throw new Error(`User lookup failed: ${lookupError.message}`);

  if (existing) {
    const updates: Record<string, string> = {};
    if (normalized === ADMIN_BOOTSTRAP_PHONE && existing.role !== "admin") {
      updates.role = "admin";
    }
    if (isGeneratedPhoneName(existing.name, normalized)) updates.name = normalized;
    if (Object.keys(updates).length === 0) return existing;

    const { data: updated, error } = await admin
      .from("users")
      .update(updates)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw new Error(`User repair failed: ${error.message}`);
    return updated;
  }

  const { data: created, error } = await admin
    .from("users")
    .insert({
      clerk_user_id: identityId,
      name: normalized,
      role: normalized === ADMIN_BOOTSTRAP_PHONE ? "admin" : "basic",
      chef: "no",
    })
    .select("*")
    .single();
  if (error) throw new Error(`User create failed: ${error.message}`);
  return created;
}

export async function createLoginToken(phone: string) {
  const normalized = normalizeIndianPhone(phone);
  if (!normalized) throw new Error("Invalid mobile number");
  const user = await ensureUserForPhone(normalized);
  const token = await new SignJWT({
    sub: user.clerk_user_id,
    phone: normalized,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getAuthSecret());
  return { token, user };
}

export async function verifyLoginToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const session = payload as SessionPayload;
    if (!session.sub || !session.phone || phoneToSyntheticId(session.phone) !== session.sub) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export async function getSessionFromCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return token ? verifyLoginToken(token) : null;
}

export async function getCurrentDbUser() {
  const session = await getSessionFromCookie();
  if (!session) return null;
  return ensureUserForPhone(session.phone);
}

export async function auth(): Promise<AuthResult> {
  const session = await getSessionFromCookie();
  if (!session) return { userId: null };
  const user = await ensureUserForPhone(session.phone);
  const role = (user.role || "basic") as UserRole;
  return {
    userId: session.sub,
    sessionClaims: {
      role,
      phone: session.phone,
      metadata: { role },
      publicMetadata: { role },
    },
  };
}

export async function currentUser(): Promise<MobileAuthUser | null> {
  const session = await getSessionFromCookie();
  if (!session) return null;
  const user = await ensureUserForPhone(session.phone);
  const fullName = isGeneratedPhoneName(user.name, session.phone)
    ? session.phone
    : user.name.trim();
  const names = splitName(fullName);
  return {
    id: session.sub,
    fullName,
    firstName: names.firstName,
    lastName: names.lastName,
    imageUrl: user.photo ?? null,
    primaryPhoneNumber: { id: "primary_phone", phoneNumber: session.phone },
    primaryPhoneNumberId: "primary_phone",
    publicMetadata: { role: (user.role || "basic") as UserRole },
    unsafeMetadata: {},
    reload: async () => {},
  };
}
