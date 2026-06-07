import { NextRequest, NextResponse } from "next/server";
import { ensureUserForPhone, getSessionFromCookie } from "@/lib/auth/server";
import { supabaseAdmin } from "@/lib/supabase/supabase";
import {
  canClaimResumeForPhone,
  hashClaimToken,
  serializeResumeForViewer,
} from "@/lib/resumes/security";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to claim your resume." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Invalid claim token" },
        { status: 400 }
      );
    }

    const tokenHash = hashClaimToken(token);
    let { data: existingResume, error: fetchError } = await supabaseAdmin
      .from("resumes")
      .select("*")
      .eq("claim_token_hash", tokenHash)
      .maybeSingle();

    // Transitional fallback for claim links issued before hashed tokens existed.
    if (!existingResume && !fetchError) {
      const legacy = await supabaseAdmin
        .from("resumes")
        .select("*")
        .eq("claim_token", token)
        .maybeSingle();
      existingResume = legacy.data;
      fetchError = legacy.error;
    }

    if (fetchError) {
      console.error("Resume claim lookup failed:", fetchError.message);
      return NextResponse.json(
        { success: false, error: "Unable to claim resume" },
        { status: 500 }
      );
    }
    if (!existingResume) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired claim link" },
        { status: 400 }
      );
    }

    if (
      existingResume.claim_token_expires_at &&
      new Date(existingResume.claim_token_expires_at).getTime() < Date.now()
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired claim link" },
        { status: 400 }
      );
    }

    if (!canClaimResumeForPhone(session.phone, existingResume.phone || "")) {
      return NextResponse.json(
        { success: false, error: "This resume belongs to a different mobile number" },
        { status: 403 }
      );
    }

    const user = await ensureUserForPhone(session.phone);
    if (
      existingResume.claimed === true &&
      existingResume.user_id &&
      existingResume.user_id !== user.id
    ) {
      return NextResponse.json(
        { success: false, error: "This resume has already been claimed" },
        { status: 409 }
      );
    }

    const { data: updatedResume, error: updateError } = await supabaseAdmin
      .from("resumes")
      .update({
        user_id: user.id,
        claimed: true,
        claim_token: null,
        claim_token_hash: null,
        claim_token_expires_at: null,
        claimed_at: new Date().toISOString(),
      })
      .eq("id", existingResume.id)
      .select("*")
      .single();

    if (updateError || !updatedResume) {
      console.error("Resume claim update failed:", updateError?.message);
      return NextResponse.json(
        { success: false, error: "Unable to claim resume" },
        { status: 500 }
      );
    }

    await supabaseAdmin.from("users").update({ chef: "yes" }).eq("id", user.id);

    return NextResponse.json({
      success: true,
      data: {
        resumeId: updatedResume.id,
        resume: serializeResumeForViewer(updatedResume, {
          role: user.role || "basic",
          userId: user.id,
        }),
        message: "Resume claimed successfully",
      },
    });
  } catch (error) {
    console.error(
      "POST /api/resumes/claim failed:",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(
      { success: false, error: "Unable to claim resume" },
      { status: 500 }
    );
  }
}
