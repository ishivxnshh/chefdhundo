import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getUserByIdentityId, searchResumes } from "@/lib/supabase/database";
import { serializeResumesForViewer } from "@/lib/resumes/security";
import type { Resume } from "@/types/supabase";

type ResumeSearchCriteria = Parameters<typeof searchResumes>[0];

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const currentUser = await getUserByIdentityId(userId);
    if (!currentUser.success || !currentUser.data) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const criteria: ResumeSearchCriteria = {};
    const location = searchParams.get("location");
    const profession = searchParams.get("profession");
    const experience = searchParams.get("experience");
    const cuisines = searchParams.get("cuisines");

    if (location) criteria.location = location;
    if (profession) criteria.profession = profession;
    if (experience) {
      const parsed = Number.parseInt(experience, 10);
      if (!Number.isNaN(parsed)) criteria.experience = parsed;
    }
    if (cuisines) {
      const parsed = cuisines
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
      if (parsed.length > 0) criteria.cuisines = parsed;
    }

    const result = await searchResumes(criteria);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: serializeResumesForViewer(result.data as Resume[], {
        role: currentUser.data.role || "basic",
        userId: currentUser.data.id,
      }),
    });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    console.error(
      "GET /api/resumes/search failed:",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
