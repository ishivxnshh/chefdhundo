import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getAllResumes, getAllResumesPaginated, createResume, getResumesByUserId, getUserByClerkId } from '@/lib/supabase/database'
import { ResumeInsert } from '@/types/supabase'

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

// Cache configuration
const CACHE_MAX_AGE = 60 // 1 minute
const STALE_WHILE_REVALIDATE = 300 // 5 minutes

// GET /api/resumes - Get all resumes or filter by user_id (supports pagination)
export async function GET(request: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth.protect()
    const role = getRoleFromClaims(sessionClaims)
    const currentUserResult = await getUserByClerkId(userId)

    if (!currentUserResult.success || !currentUserResult.data) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const currentSupabaseUserId = currentUserResult.data.id

    const searchParams = request.nextUrl.searchParams
    const requestedUserId = searchParams.get('user_id')
    
    // Pagination params
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '12', 10)
    const search = searchParams.get('search') || ''
    const experience = searchParams.get('experience') || ''
    const profession = searchParams.get('profession') || ''

    if (requestedUserId) {
      if (role !== 'admin' && requestedUserId !== currentSupabaseUserId) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        )
      }

      // Get resumes for specific user (no pagination needed)
      const result = await getResumesByUserId(requestedUserId)
      
      if (!result.success) {
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
  try {
    const { userId, sessionClaims } = await auth.protect()
    const role = getRoleFromClaims(sessionClaims)
    const currentUserResult = await getUserByClerkId(userId)

    if (!currentUserResult.success || !currentUserResult.data) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const currentSupabaseUserId = currentUserResult.data.id

    const body = await request.json()

    // Validate required fields
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

    // Create resume data object matching Supabase schema
    const resumeData: ResumeInsert = {
      user_id: body.user_id,
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      user_location: body.user_location || null,
      age_range: body.age_range || null,
      gender: body.gender || null,
      city: body.city || null,
      user_state: body.user_state || null,
      pin_code: body.pin_code || null,
      experience_years: body.experience_years || null,
      experiences: body.experiences || null,
      profession: body.profession || null,
      job_role: body.job_role || null,
      education: body.education || null,
      cuisines: body.cuisines || null,
      languages: body.languages || null,
      certifications: body.certifications || null,
      current_ctc: body.current_ctc || null,
      expected_ctc: body.expected_ctc || null,
      notice_period: body.notice_period || null,
      training: body.training || null,
      preferred_location: body.preferred_location || null,
      joining: body.joining || null,
      work_type: body.work_type || null,
      business_type: body.business_type || null,
      linkedin_profile: body.linkedin_profile || null,
      portfolio_website: body.portfolio_website || null,
      bio: body.bio || null,
      passport: body.passport || null,
      photo: body.photo || null,
      resume_file: body.resume_file || null
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
      message: 'Resume created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/resumes:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}