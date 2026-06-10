import { NextRequest, NextResponse } from "next/server";
import { auth, ensureUserForPhone } from "@/lib/auth/server";
import {
  createResume,
  getAllResumes,
  getAllResumesPaginated,
  getResumesByUserId,
  getUserByIdentityId,
} from "@/lib/supabase/database";
import type { Resume, ResumeInsert } from "@/types/supabase";
import { supabaseAdmin } from "@/lib/supabase/supabase";
import {
  serializeResumeForViewer,
  serializeResumesForViewer,
  verifyWhatsappIngestionSecret,
} from "@/lib/resumes/security";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error || "");
}

function isSchemaUnavailable(error: unknown) {
  const message = errorMessage(error).toLowerCase();
  return (
    message.includes("no rows found") ||
    message.includes("does not exist") ||
    (message.includes("permission denied") && message.includes("resumes"))
  );
}

function safeEnum<const T extends readonly string[]>(
  value: unknown,
  allowed: T
): T[number] | null {
  return typeof value === "string" && allowed.includes(value)
    ? (value as T[number])
    : null;
}

async function getViewer() {
  const { userId } = await auth();
  if (!userId) return null;
  const result = await getUserByIdentityId(userId);
  if (!result.success || !result.data) return null;
  return {
    identityId: userId,
    userId: result.data.id,
    role: result.data.role || "basic",
  };
}

function schemaUnavailableResponse(message: string) {
  return NextResponse.json(
    { success: true, data: [], schemaReady: false, message },
    { status: 200 }
  );
}

export async function GET(request: NextRequest) {
  try {
    const viewer = await getViewer();
    if (!viewer) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const requestedUserId = searchParams.get("user_id");
    const page = Number.parseInt(searchParams.get("page") || "1", 10);
    const limit = Number.parseInt(searchParams.get("limit") || "12", 10);

    if (requestedUserId) {
      if (viewer.role !== "admin" && requestedUserId !== viewer.userId) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }

      const result = await getResumesByUserId(requestedUserId);
      if (!result.success) {
        if (isSchemaUnavailable(result.error)) {
          return schemaUnavailableResponse("Resumes are not available yet");
        }
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: serializeResumesForViewer(result.data as Resume[], viewer),
      });
    }

    const usePagination = searchParams.has("page") || searchParams.has("limit");
    if (usePagination) {
      const result = await getAllResumesPaginated({
        page,
        limit,
        search: searchParams.get("search") || "",
        experience: searchParams.get("experience") || "",
        profession: searchParams.get("profession") || "",
      });
      if (!result.success) {
        if (isSchemaUnavailable(result.error)) {
          return schemaUnavailableResponse("Resumes are not available yet");
        }
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }

      const response = NextResponse.json({
        success: true,
        data: serializeResumesForViewer(result.data as Resume[], viewer),
        pagination: result.pagination,
      });
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    const result = await getAllResumes();
    if (!result.success) {
      if (isSchemaUnavailable(result.error)) {
        return schemaUnavailableResponse("Resumes are not available yet");
      }
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: serializeResumesForViewer(result.data as Resume[], viewer),
    });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    console.error("GET /api/resumes failed:", errorMessage(error));
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const isWhatsapp =
    body.from_whatsapp === true || body.from_whatsapp === "true";

  try {
    let viewer: Awaited<ReturnType<typeof getViewer>> = null;

    // --- WhatsApp Bot Path ---
    // Verify the shared secret so only the trusted bot can use this path.
    // Once verified, immediately create/retrieve the user record by phone number
    // using the same helper the claim flow uses, so the resume is owned from birth.
    if (isWhatsapp) {
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
    } else {
      // --- Website / Authenticated Path (unchanged) ---
      viewer = await getViewer();
      if (!viewer) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    if (!body.name || !body.phone) {
      return NextResponse.json(
        { success: false, error: "name and phone are required" },
        { status: 400 }
      );
    }

    if (
      !isWhatsapp &&
      viewer?.role !== "admin" &&
      body.user_id !== viewer?.userId
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // --- Determine ownership ---
    // For WhatsApp requests: resolve the user record immediately from the phone number.
    // ensureUserForPhone() mirrors the exact logic used in the claim flow:
    //   - Normalises the phone to +91XXXXXXXXXX
    //   - Looks up the users table by clerk_user_id (synthetic phone identity)
    //   - Creates a new user row if one does not exist yet
    // This means the resume is owned from the moment it is created — no claim step needed.
    let whatsappUserId: string | null = null;
    if (isWhatsapp) {
      try {
        const whatsappUser = await ensureUserForPhone(String(body.phone));
        whatsappUserId = whatsappUser.id;
        // Mark the user as a chef, consistent with what the claim flow does.
        await supabaseAdmin
          .from("users")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update({ chef: "yes" } as any)
          .eq("id", whatsappUserId);
      } catch (userErr) {
        console.error("POST /api/resumes — ensureUserForPhone failed:", errorMessage(userErr));
        return NextResponse.json(
          { success: false, error: "Could not resolve user for this phone number" },
          { status: 500 }
        );
      }
    }

    const resumeData: ResumeInsert = {
      // WhatsApp resumes are immediately owned; web resumes use the viewer's ID.
      user_id: isWhatsapp ? whatsappUserId : viewer?.userId || null,
      name: String(body.name),
      phone: String(body.phone),
      user_location: (body.user_location as string) || null,
      age_range: (body.age_range as string) || null,
      gender: safeEnum(body.gender, [
        "Male",
        "Female",
        "Other",
        "Prefer not to say",
      ] as const),
      city: (body.city as string) || null,
      user_state: (body.user_state as string) || null,
      pin_code: (body.pin_code as string) || null,
      experience_years: (body.experience_years as number) || null,
      experiences: (body.experiences as string) || null,
      profession: (body.profession as string) || null,
      job_role: (body.job_role as string) || null,
      education: (body.education as string) || null,
      cuisines: (body.cuisines as string) || null,
      languages: (body.languages as string) || null,
      certifications: (body.certifications as string) || null,
      current_ctc: (body.current_ctc as string) || null,
      expected_ctc: (body.expected_ctc as string) || null,
      notice_period: (body.notice_period as string) || null,
      training: safeEnum(body.training, ["yes", "no", "try"] as const),
      preferred_location: (body.preferred_location as string) || null,
      joining: safeEnum(body.joining, ["immediate", "specific"] as const),
      work_type: safeEnum(body.work_type, ["full", "part", "contract"] as const),
      business_type: safeEnum(body.business_type, ["any", "new", "old"] as const),
      linkedin_profile: (body.linkedin_profile as string) || null,
      portfolio_website: (body.portfolio_website as string) || null,
      bio: (body.bio as string) || null,
      passport: (body.passport as string) || null,
      photo: (body.photo as string) || null,
      resume_file: (body.resume_file as string) || null,
      // WhatsApp resumes are claimed immediately — no token, no ownership transfer.
      claimed: true,
      claim_token: null,
      claim_token_hash: null,
      claim_token_expires_at: null,
    };

    const result = await createResume(resumeData);
    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: serializeResumeForViewer(result.data as Resume, {
          role: viewer?.role || "basic",
          userId: viewer?.userId || whatsappUserId,
        }),
        // No token returned — WhatsApp resumes no longer require a claim step.
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/resumes failed:", errorMessage(error));
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
