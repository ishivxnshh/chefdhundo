import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/auth/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    ...authCookieOptions(process.env.NODE_ENV === "production"),
    expires: new Date(0),
    maxAge: 0,
  });
  return response;
}
