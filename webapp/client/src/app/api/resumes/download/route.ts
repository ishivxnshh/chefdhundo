import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/supabase";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const resumeId = request.nextUrl.searchParams.get("resumeId");
    if (!resumeId) {
      return NextResponse.json(
        { success: false, error: "Missing resumeId" },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();
    const { data: currentUser } = await admin
      .from("users")
      .select("id, role")
      .eq("clerk_user_id", userId)
      .maybeSingle();
    const { data: resume } = await admin
      .from("resumes")
      .select("user_id, resume_file")
      .eq("id", resumeId)
      .maybeSingle();
    if (!currentUser || !resume) {
      return NextResponse.json(
        { success: false, error: "Resume not found" },
        { status: 404 }
      );
    }

    const isOwner = resume.user_id === currentUser.id;
    const canDownload =
      isOwner || currentUser.role === "admin" || currentUser.role === "pro";
    if (!canDownload) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }
    if (!resume.resume_file) {
      return NextResponse.json(
        { success: false, error: "No resume file uploaded" },
        { status: 404 }
      );
    }

    const filePath = resume.resume_file.startsWith("http")
      ? `${resume.user_id}/${resumeId}.pdf`
      : resume.resume_file;
    const { data, error } = await admin.storage
      .from("resumes")
      .createSignedUrl(filePath, 5 * 60);
    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "Unable to generate download URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: data.signedUrl,
      expiresIn: 300,
    });
  } catch (error) {
    console.error(
      "GET /api/resumes/download failed:",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(
      { success: false, error: "Unable to generate download URL" },
      { status: 500 }
    );
  }
}
