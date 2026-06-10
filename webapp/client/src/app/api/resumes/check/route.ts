import { NextRequest, NextResponse } from "next/server";
import { getResumeByPhone } from "@/lib/supabase/database";
import { verifyWhatsappIngestionSecret } from "@/lib/resumes/security";

export async function POST(request: NextRequest) {
  try {
    const providedSecret = request.headers.get("x-chefdhundo-webhook-secret");
    const configuredSecret = process.env.WHATSAPP_INGEST_SECRET;

    console.warn("[DIAGNOSTIC] POST /api/resumes/check WhatsApp Auth Check:", {
      url: request.url,
      method: request.method,
      env: process.env.NODE_ENV,
      hasConfiguredSecret: !!configuredSecret,
      configuredLength: configuredSecret?.length,
      providedLength: providedSecret?.length,
      headers: Array.from(request.headers.keys())
    });

    const trusted = verifyWhatsappIngestionSecret(
      providedSecret,
      configuredSecret
    );
    if (!trusted) {
      console.warn("[DIAGNOSTIC] POST /api/resumes/check returning 401. trusted=false");
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
