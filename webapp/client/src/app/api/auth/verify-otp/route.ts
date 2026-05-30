import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  createLoginToken,
  normalizeIndianPhone,
  verifyOtp,
} from "@/lib/auth/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = normalizeIndianPhone(body?.phone || "");
    const otp = String(body?.otp || "");

    if (!phone || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { success: false, error: "Invalid phone or OTP" },
        { status: 400 }
      );
    }

    const isValid = await verifyOtp(phone, otp);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Wrong or expired OTP" },
        { status: 400 }
      );
    }

    const { token, user } = await createLoginToken(phone);
    const response = NextResponse.json({
      success: true,
      message: "Logged in successfully",
      user: {
        id: user.id,
        role: user.role,
        phone,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("verify-otp error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}
