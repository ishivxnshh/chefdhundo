import { NextRequest, NextResponse } from "next/server";

type SessionPayload = {
  sub: string;
  phone: string;
};

const protectedPrefixes = ["/dashboard", "/admin"];
const authCookieName = "chef_auth";

function base64UrlToUint8Array(base64Url: string) {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

async function verifyHs256Jwt(token: string, secret: string): Promise<SessionPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerPart, payloadPart, signaturePart] = parts;
  const header = safeJsonParse<{ alg?: string }>(
    new TextDecoder().decode(base64UrlToUint8Array(headerPart))
  );
  if (!header || header.alg !== "HS256") return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlToUint8Array(signaturePart),
    new TextEncoder().encode(`${headerPart}.${payloadPart}`)
  );

  if (!valid) return null;

  const payload = safeJsonParse<SessionPayload & { exp?: number }>(
    new TextDecoder().decode(base64UrlToUint8Array(payloadPart))
  );

  if (!payload || !payload.sub || !payload.phone) {
    return null;
  }

  if (typeof payload.exp === "number") {
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;
  }

  return { sub: payload.sub, phone: payload.phone };
}

async function readSession(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(authCookieName)?.value;
  if (!token) return null;

  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  return verifyHs256Jwt(token, secret);
}

function isPathProtected(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!isPathProtected(pathname) && !pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  const session = await readSession(req);
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
