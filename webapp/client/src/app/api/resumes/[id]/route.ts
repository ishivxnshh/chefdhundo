import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'
import { updateResume, deleteResume, getUserByIdentityId } from '@/lib/supabase/database'
import { createSupabaseAdminClient } from '@/lib/supabase/supabase'
import { ResumeUpdate } from '@/types/supabase'

type ResumeRouteParams = {
  id?: string | string[]
}

type ResumeRouteContext = {
  params: Promise<ResumeRouteParams>
}

async function canMutateResume(resumeId: string) {
  const { userId } = await auth()
  if (!userId) return false

  const user = await getUserByIdentityId(userId)
  if (!user.success || !user.data) return false
  if (user.data.role === 'admin') return true

  const supabase = createSupabaseAdminClient()
  const { data: resume } = await supabase
    .from('resumes')
    .select('user_id')
    .eq('id', resumeId)
    .maybeSingle()

  return resume?.user_id === user.data.id
}

// PUT /api/resumes/[id] - Update resume
export async function PUT(
  request: NextRequest,
  context: ResumeRouteContext
) {
  try {
    const params = await context.params
    const rawId = params?.id
    const resumeId = Array.isArray(rawId) ? rawId[0] : rawId
    const body = await request.json()

    if (!resumeId) {
      return NextResponse.json(
        { success: false, error: 'Resume ID is required' },
        { status: 400 }
      )
    }

    if (!(await canMutateResume(resumeId))) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Create update object with only provided fields
    const updates: ResumeUpdate = {}

    // Map all possible fields that can be updated
    const updatableFields = [
      'name', 'phone', 'user_location', 'age_range', 'gender',
      'city', 'user_state', 'pin_code', 'experience_years', 'experiences',
      'profession', 'job_role', 'education', 'cuisines', 'languages',
      'certifications', 'current_ctc', 'expected_ctc', 'notice_period',
      'training', 'preferred_location', 'joining', 'work_type',
      'business_type', 'linkedin_profile', 'portfolio_website', 'bio',
      'passport', 'photo', 'resume_file', 'verified'
    ]

    updatableFields.forEach(field => {
      if (body[field] !== undefined) {
        updates[field as keyof ResumeUpdate] = body[field]
      }
    })

    const result = await updateResume(resumeId, updates)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Resume updated successfully'
    })
  } catch (error) {
    console.error('Error in PUT /api/resumes/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/resumes/[id] - Delete resume
export async function DELETE(
  request: NextRequest,
  context: ResumeRouteContext
) {
  try {
    const params = await context.params
    const rawId = params?.id
    const resumeId = Array.isArray(rawId) ? rawId[0] : rawId

    if (!resumeId) {
      return NextResponse.json(
        { success: false, error: 'Resume ID is required' },
        { status: 400 }
      )
    }

    if (!(await canMutateResume(resumeId))) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const result = await deleteResume(resumeId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: null,
      message: 'Resume deleted successfully'
    })
  } catch (error) {
    console.error('Error in DELETE /api/resumes/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
