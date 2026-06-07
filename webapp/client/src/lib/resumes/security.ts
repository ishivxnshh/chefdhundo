import crypto from "crypto";

export type ResumeViewer = {
  role: "basic" | "pro" | "admin" | string;
  userId: string | null;
};

const ALWAYS_PRIVATE_FIELDS = new Set([
  "claim_token",
  "claim_token_hash",
  "claim_token_expires_at",
  "claimed_at",
  "email",
]);

const OWNER_PRIVATE_FIELDS = new Set([
  "passport",
  "resume_file",
  "user_id",
]);

function normalizeIndianPhone(phone: string) {
  const cleaned = String(phone || "").trim().replace(/[^\d+]/g, "");
  if (/^\+91[6-9]\d{9}$/.test(cleaned)) return cleaned;
  if (/^91[6-9]\d{9}$/.test(cleaned)) return `+${cleaned}`;
  if (/^[6-9]\d{9}$/.test(cleaned)) return `+91${cleaned}`;
  return null;
}

function maskPhone(phone: unknown) {
  const value = String(phone || "");
  const normalized = normalizeIndianPhone(value);
  if (!normalized) return null;
  return `${normalized.slice(0, 3)}******${normalized.slice(-4)}`;
}

export function serializeResumeForViewer<T extends Record<string, unknown>>(
  resume: T,
  viewer: ResumeViewer
) {
  const isOwner = Boolean(viewer.userId && resume.user_id === viewer.userId);
  const isAdmin = viewer.role === "admin";
  const canViewContact = isOwner || isAdmin || viewer.role === "pro";
  const canViewPrivate = isOwner || isAdmin;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(resume)) {
    if (ALWAYS_PRIVATE_FIELDS.has(key)) continue;
    if (OWNER_PRIVATE_FIELDS.has(key) && !canViewPrivate) continue;
    if (key === "phone") {
      result.phone = canViewContact ? value : maskPhone(value);
      continue;
    }
    result[key] = value;
  }

  return result;
}

export function serializeResumesForViewer<T extends Record<string, unknown>>(
  resumes: T[] | null | undefined,
  viewer: ResumeViewer
) {
  return (resumes || []).map((resume) => serializeResumeForViewer(resume, viewer));
}

export function canClaimResumeForPhone(sessionPhone: string, resumePhone: string) {
  const normalizedSessionPhone = normalizeIndianPhone(sessionPhone);
  const normalizedResumePhone = normalizeIndianPhone(resumePhone);
  return Boolean(
    normalizedSessionPhone &&
      normalizedResumePhone &&
      normalizedSessionPhone === normalizedResumePhone
  );
}

export function hashClaimToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function verifyWhatsappIngestionSecret(
  provided: string | null | undefined,
  configured: string | null | undefined
) {
  if (!provided || !configured) return false;
  const providedBuffer = Buffer.from(provided);
  const configuredBuffer = Buffer.from(configured);
  return (
    providedBuffer.length === configuredBuffer.length &&
    crypto.timingSafeEqual(providedBuffer, configuredBuffer)
  );
}
