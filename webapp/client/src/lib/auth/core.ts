import crypto from "crypto";

export const AUTH_COOKIE_NAME = "chef_auth";
export const AUTH_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export function normalizeIndianPhone(phone: string) {
  const cleaned = String(phone || "").trim().replace(/[^\d+]/g, "");
  if (/^\+91[6-9]\d{9}$/.test(cleaned)) return cleaned;
  if (/^91[6-9]\d{9}$/.test(cleaned)) return `+${cleaned}`;
  if (/^[6-9]\d{9}$/.test(cleaned)) return `+91${cleaned}`;
  return null;
}

export function phoneToSyntheticId(phone: string) {
  return `phone:${phone}`;
}

export function syntheticIdToPhone(id: string | null | undefined) {
  if (!id || !id.startsWith("phone:")) return null;
  return normalizeIndianPhone(id.slice("phone:".length));
}

export function hashRequestIp(ip: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(ip).digest("hex");
}

export function authCookieOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  };
}
