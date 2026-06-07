import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/supabase";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPE = "application/pdf";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const resumeId = formData.get("resumeId") as string | null;
    if (!file || !resumeId) {
      return NextResponse.json(
        { success: false, error: "Missing file or resumeId" },
        { status: 400 }
      );
    }
    if (file.type !== ALLOWED_FILE_TYPE || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Upload a PDF smaller than 10MB" },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();
    const { data: user } = await admin
      .from("users")
      .select("id")
      .eq("clerk_user_id", userId)
      .maybeSingle();
    const { data: resume } = await admin
      .from("resumes")
      .select("user_id")
      .eq("id", resumeId)
      .maybeSingle();
    if (!user || !resume) {
      return NextResponse.json(
        { success: false, error: "Resume not found" },
        { status: 404 }
      );
    }
    if (resume.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const filePath = `${user.id}/${resumeId}.pdf`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: uploadError } = await admin.storage
      .from("resumes")
      .upload(filePath, bytes, {
        contentType: ALLOWED_FILE_TYPE,
        upsert: true,
      });
    if (uploadError) {
      return NextResponse.json(
        { success: false, error: "Upload failed" },
        { status: 500 }
      );
    }

    const { error: updateError } = await admin
      .from("resumes")
      .update({ resume_file: filePath })
      .eq("id", resumeId);
    if (updateError) {
      return NextResponse.json(
        { success: false, error: "Unable to save resume file" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: `/api/resumes/download?resumeId=${encodeURIComponent(resumeId)}`,
      message: "Resume uploaded successfully",
    });
  } catch (error) {
    console.error(
      "POST /api/resumes/upload failed:",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(
      { success: false, error: "Upload failed" },
      { status: 500 }
    );
  }
}
