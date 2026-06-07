import { NextResponse } from "next/server";
import {
  checkOtpRequestAllowed,
  createOtp,
  getRequestIpHash,
  invalidateOtp,
  normalizeIndianPhone,
  saveOtp,
  updateOtpDelivery,
} from "@/lib/auth/server";

function rateLimitMessage(reason: string | null) {
  if (reason === "global_daily_limit") {
    return "OTP service has reached its daily limit. Please try again later.";
  }
  if (reason === "phone_daily_limit") {
    return "Too many OTP requests for this mobile number. Please try again tomorrow.";
  }
  return "Please wait before requesting another OTP.";
}

export async function POST(req: Request) {
  let phone: string | null = null;
  let otpId: string | null = null;

  try {
    const body = await req.json();
    phone = normalizeIndianPhone(body?.phone || "");
    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Enter a valid Indian mobile number" },
        { status: 400 }
      );
    }

    const ipHash = getRequestIpHash(req);
    const limit = await checkOtpRequestAllowed(phone, ipHash);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: rateLimitMessage(limit.reason) },
        { status: 429 }
      );
    }

    const apiKey = process.env.TEXTBEE_API_KEY;
    const deviceId = process.env.TEXTBEE_DEVICE_ID;
    if (!apiKey || !deviceId) {
      return NextResponse.json(
        { success: false, error: "OTP service is not configured" },
        { status: 503 }
      );
    }

    const otp = createOtp();
    otpId = await saveOtp(phone, otp, ipHash);
    const textBeeResponse = await fetch(
      `https://api.textbee.dev/api/v1/gateway/devices/${deviceId}/send-sms`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          recipients: [phone],
          message: `Your ChefDhundo login OTP is ${otp}. It expires in 5 minutes.`,
        }),
      }
    );

    if (!textBeeResponse.ok) {
      await invalidateOtp(otpId, phone);
      return NextResponse.json(
        { success: false, error: "Could not send OTP SMS. Please try again." },
        { status: 502 }
      );
    }

    const responseBody = await textBeeResponse.json().catch(() => ({}));
    const providerMessageId =
      responseBody?.data?.smsBatchId || responseBody?.smsBatchId || null;
    await updateOtpDelivery(otpId, {
      provider_message_id: providerMessageId,
      provider_status: "accepted",
      accepted_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "OTP request accepted",
      requestId: otpId,
    });
  } catch (error) {
    if (phone && otpId) {
      await invalidateOtp(otpId, phone).catch(() => undefined);
    }
    console.error(
      "POST /api/auth/request-otp failed:",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}
