import { NextRequest, NextResponse } from "next/server";
import { getResumeByPhone } from "@/lib/supabase/database";
import { verifyWhatsappIngestionSecret } from "@/lib/resumes/security";

export async function POST(request: NextRequest) {
  try {
    const trusted = verifyWhatsappIngestionSecret(
      request.headers.get("x-chefdhundo-webhook-secret"),
      process.env.WHATSAPP_INGEST_SECRET
    );
    if (!trusted) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    if (!phone) {
      return NextResponse.json(
        { success: false, error: "phone is required" },
        { status: 400 }
      );
    }

    const result = await getResumeByPhone(phone);
    if (result.success && result.data) {
      return NextResponse.json({
        exists: true,
        claimed: result.data.claimed === true,
      });
    }

    return NextResponse.json({ exists: false, claimed: false });
  } catch (error) {
    console.error(
      "POST /api/resumes/check failed:",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(
      { success: false, error: "Unable to check resume" },
      { status: 500 }
    );
  }
}
