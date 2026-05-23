import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getAllResumes, getAllResumesPaginated, createResume, getResumesByUserId, getUserByClerkId } from '@/lib/supabase/database'
import { ResumeInsert } from '@/types/supabase'
import { generateToken } from "@/lib/generateToken"

function isMissingResumesTableError(error: any): boolean {
  const normalized = String(error?.message || '').toLowerCase()
  return normalized.includes('no rows found') || normalized.includes('does not exist')
}

function isResumesPermissionError(error: any): boolean {
  const normalized = String(error?.message || '').toLowerCase()
  return normalized.includes('permission denied') && normalized.includes('resumes')
}

function getRoleFromClaims(sessionClaims: unknown): string {
  const claims = sessionClaims as
    | {
      metadata?: { role?: string }
      publicMetadata?: { role?: string }
      role?: string
    }
    | undefined

  return claims?.metadata?.role || claims?.publicMetadata?.role || claims?.role || 'user'
}

// --- Safe Enum Validators ---
function safeGender(value: unknown): 'Male' | 'Female' | 'Other' | 'Prefer not to say' | null {
  const allowed = ["Male", "Female", "Other", "Prefer not to say"]
  const strVal = typeof value === 'string' ? value : ''
  return allowed.includes(strVal) ? (strVal as any) : null
}

function safeTraining(value: unknown): 'yes' | 'no' | 'try' | null {
  const allowed = ["yes", "no", "try"]
  const strVal = typeof value === 'string' ? value : ''
  return allowed.includes(strVal) ? (strVal as any) : null
}

function safeWorkType(value: unknown): 'full' | 'part' | 'contract' | null {
  const allowed = ["full", "part", "contract"]
  const strVal = typeof value === 'string' ? value : ''
  return allowed.includes(strVal) ? (strVal as any) : null
}

function safeJoining(value: unknown): 'immediate' | 'specific' | null {
  const allowed = ["immediate", "specific"]
  const strVal = typeof value === 'string' ? value : ''
  return allowed.includes(strVal) ? (strVal as any) : null
}

function safeBusinessType(value: unknown): 'any' | 'new' | 'old' | null {
  const allowed = ["any", "new", "old"]
  const strVal = typeof value === 'string' ? value : ''
  return allowed.includes(strVal) ? (strVal as any) : null
}
// ----------------------------

// Cache configuration
const CACHE_MAX_AGE = 60 // 1 minute
const STALE_WHILE_REVALIDATE = 300 // 5 minutes

// GET /api/resumes - Get all resumes or filter by user_id (supports pagination)
export async function GET(request: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth()
    const role = getRoleFromClaims(sessionClaims)
    let currentSupabaseUserId: string | null = null

    if (userId) {
      const currentUserResult = await getUserByClerkId(userId)
      if (currentUserResult.success && currentUserResult.data) {
        currentSupabaseUserId = currentUserResult.data.id
      }
    }

    const searchParams = request.nextUrl.searchParams
    const requestedUserId = searchParams.get('user_id')

    // Pagination params
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '12', 10)
    const search = searchParams.get('search') || ''
    const experience = searchParams.get('experience') || ''
    const profession = searchParams.get('profession') || ''

    if (requestedUserId) {
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      }

      if (role !== 'admin' && requestedUserId !== currentSupabaseUserId) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        )
      }

      // Get resumes for specific user (no pagination needed)
      const result = await getResumesByUserId(requestedUserId)

      if (!result.success) {
        if (isMissingResumesTableError(result.error)) {
          return NextResponse.json(
            {
              success: true,
              data: [],
              schemaReady: false,
              message: 'Resumes table is not initialized in Supabase yet',
            },
            { status: 200 }
          )
        }

        if (isResumesPermissionError(result.error)) {
          return NextResponse.json(
            {
              success: true,
              data: [],
              schemaReady: false,
              message: 'Supabase role cannot read resumes table. Check RLS policies or SUPABASE_SERVICE_ROLE in deployment env.',
            },
            { status: 200 }
          )
        }

        return NextResponse.json(
          { success: false, error: result.error, data: null },
          { status: 200 }
        )
      }

      return NextResponse.json({
        success: true,
        data: result.data,
        message: `Found ${result.data?.length || 0} resumes for user`
      })
    } else {
      // Check if pagination is requested
      const usePagination = searchParams.has('page') || searchParams.has('limit')

      if (usePagination) {
        // Get paginated resumes with filters
        const result = await getAllResumesPaginated({
          page,
          limit,
          search,
          experience,
          profession
        })

        if (!result.success) {
          if (isMissingResumesTableError(result.error)) {
            return NextResponse.json(
              {
                success: true,
                data: [],
                pagination: {
                  page,
                  limit,
                  total: 0,
                  totalPages: 1,
                  hasMore: false,
                },
                schemaReady: false,
                message: 'Resumes table is not initialized in Supabase yet',
              },
              { status: 200 }
            )
          }

          if (isResumesPermissionError(result.error)) {
            return NextResponse.json(
              {
                success: true,
                data: [],
                pagination: {
                  page,
                  limit,
                  total: 0,
                  totalPages: 1,
                  hasMore: false,
                },
                schemaReady: false,
                message: 'Supabase role cannot read resumes table. Check RLS policies or SUPABASE_SERVICE_ROLE in deployment env.',
              },
              { status: 200 }
            )
          }

          return NextResponse.json(
            { success: false, error: result.error },
            { status: 500 }
          )
        }

        const response = NextResponse.json({
          success: true,
          data: result.data,
          pagination: result.pagination,
          message: `Found ${result.pagination?.total || 0} resumes`
        })

        // Add cache headers for public data
        response.headers.set('Cache-Control', `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`)
        return response
      } else {
        // Legacy: Get all resumes (for backward compatibility)
        const result = await getAllResumes()

        if (!result.success) {
          if (isMissingResumesTableError(result.error)) {
            return NextResponse.json(
              {
                success: true,
                data: [],
                schemaReady: false,
                message: 'Resumes table is not initialized in Supabase yet',
              },
              { status: 200 }
            )
          }

          if (isResumesPermissionError(result.error)) {
            return NextResponse.json(
              {
                success: true,
                data: [],
                schemaReady: false,
                message: 'Supabase role cannot read resumes table. Check RLS policies or SUPABASE_SERVICE_ROLE in deployment env.',
              },
              { status: 200 }
            )
          }

          return NextResponse.json(
            { success: false, error: result.error },
            { status: 500 }
          )
        }

        const response = NextResponse.json({
          success: true,
          data: result.data,
          message: `Found ${result.data?.length || 0} resumes`
        })

        // Add cache headers for public data
        response.headers.set('Cache-Control', `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`)
        return response
      }
    }
  } catch (error) {
    console.error('Error in GET /api/resumes:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/resumes - Create new resume
export async function POST(request: NextRequest) {
  // ── Step 1: Parse body first so we can check from_whatsapp before auth ──
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const isWhatsapp =
    body.from_whatsapp === true;
  body.from_whatsapp === "true";

  console.log("🔥 Incoming body:", body);
  console.log("🔥 from_whatsapp:", body.from_whatsapp);

  try {
    let userId: string | null = null
    let sessionClaims: unknown = null
    let currentSupabaseUserId: string | null = null

    // ── Step 2: Only run Clerk auth for non-WhatsApp requests ──────────────
    if (!isWhatsapp) {
      const authResult = await auth()
      userId = authResult.userId
      sessionClaims = authResult.sessionClaims

      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      }

      const currentUserResult = await getUserByClerkId(userId)

      if (!currentUserResult.success || !currentUserResult.data) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        )
      }

      currentSupabaseUserId = currentUserResult.data.id
    } else {
      console.log('📱 WhatsApp resume creation — skipping Clerk auth')
    }

    const role = getRoleFromClaims(sessionClaims)

    // ── Step 3: Validation ─────────────────────────────────────────────────
    if (isWhatsapp) {
      if (!body.name || !body.phone) {
        return NextResponse.json(
          { success: false, error: 'name and phone are required' },
          { status: 400 }
        )
      }
    } else {
      if (!body.user_id || !body.name || !body.email) {
        return NextResponse.json(
          { success: false, error: 'user_id, name, and email are required' },
          { status: 400 }
        )
      }

      if (role !== 'admin' && body.user_id !== currentSupabaseUserId) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        )
      }
    }

    // ── Step 4: Build resume payload ───────────────────────────────────────
    if (!isWhatsapp) {
      console.log('📋 Resume Creation - Website Flow')
      console.log('  🔐 Clerk userId:', userId)
      console.log('  📦 Supabase userId:', currentSupabaseUserId)
      console.log('  📨 Request user_id:', body.user_id)
    }

    const resumeData: ResumeInsert = {
      user_id: isWhatsapp ? null : currentSupabaseUserId,
      name: (body.name as string) || '',
      email: isWhatsapp ? `${body.phone}@wa.chefdhundo.com` : (body.email as string) || '',
      phone: (body.phone as string) || null,
      user_location: (body.user_location as string) || null,
      age_range: (body.age_range as string) || null,
      gender: safeGender(body.gender),
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
      training: safeTraining(body.training),
      preferred_location: (body.preferred_location as string) || null,
      joining: safeJoining(body.joining),
      work_type: safeWorkType(body.work_type),
      business_type: safeBusinessType(body.business_type),
      linkedin_profile: (body.linkedin_profile as string) || null,
      portfolio_website: (body.portfolio_website as string) || null,
      bio: (body.bio as string) || null,
      passport: (body.passport as string) || null,
      photo: (body.photo as string) || null,
      resume_file: (body.resume_file as string) || null,

      // 🔥 NEW (IMPORTANT)
      claimed: isWhatsapp ? false : true,
      claim_token: isWhatsapp ? generateToken() : null
    }

    if (!isWhatsapp) {
      console.log('  ✅ Final resumeData.user_id:', resumeData.user_id)
    }

    const result = await createResume(resumeData)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      token: isWhatsapp ? result.data?.claim_token : null
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Error in POST /api/resumes:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}