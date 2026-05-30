import { NextResponse } from "next/server";
import {
  canRequestOtp,
  createOtp,
  normalizeIndianPhone,
  saveOtp,
} from "@/lib/auth/server";

type TextBeeMessage = {
  smsBatch?: string;
  recipient?: string;
  status?: string;
  errorMessage?: string;
  message?: string;
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = normalizeIndianPhone(body?.phone || "");

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Enter a valid Indian mobile number" },
        { status: 400 }
      );
    }

    const allowed = await canRequestOtp(phone);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "Please wait before requesting another OTP" },
        { status: 429 }
      );
    }

    const otp = createOtp();
    await saveOtp(phone, otp);

    const apiKey = process.env.TEXTBEE_API_KEY;
    const deviceId = process.env.TEXTBEE_DEVICE_ID;
    if (!apiKey || !deviceId) {
      return NextResponse.json(
        { success: false, error: "TextBee is not configured on server" },
        { status: 500 }
      );
    }

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
      const errorText = await textBeeResponse.text();
      console.error("TextBee send failed:", errorText);
      return NextResponse.json(
        { success: false, error: "Could not send OTP SMS. Check TextBee setup." },
        { status: 500 }
      );
    }

    let smsBatchId: string | null = null;
    try {
      const body = await textBeeResponse.json();
      smsBatchId = body?.data?.smsBatchId || null;
    } catch {
      smsBatchId = null;
    }

    // Verify short-term delivery state so we don't return false-positive success.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await wait(1200);
        const messagesRes = await fetch(
          `https://api.textbee.dev/api/v1/gateway/devices/${deviceId}/messages?page=1&limit=30`,
          { headers: { "x-api-key": apiKey } }
        );

      if (!messagesRes.ok) continue;

      const messagesPayload = await messagesRes.json();
      const rows: TextBeeMessage[] = Array.isArray(messagesPayload?.data)
        ? messagesPayload.data
        : [];

      const matched = rows.find((row) => {
        const sameRecipient = row?.recipient === phone;
        const sameBatch = smsBatchId ? row?.smsBatch === smsBatchId : false;
        const hasOtp = String(row?.message || "").includes(otp);
        return sameRecipient && (sameBatch || hasOtp);
      });

      if (!matched?.status) continue;

      if (matched.status.toLowerCase() === "failed") {
        return NextResponse.json(
          {
            success: false,
            error:
              matched.errorMessage ||
              "OTP SMS failed on device. Check TextBee SMS permission.",
          },
          { status: 502 }
        );
      }

      if (["sent", "dispatched", "delivered"].includes(matched.status.toLowerCase())) {
        break;
      }
    }

    return NextResponse.json({ success: true, message: "OTP sent" });
  } catch (error) {
    console.error("request-otp error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}
