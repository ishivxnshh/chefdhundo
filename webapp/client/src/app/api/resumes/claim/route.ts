import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/supabase'
import { getUserByClerkId } from '@/lib/supabase/database'

/**
 * POST /api/resumes/claim
 * 
 * Claim a resume using a unique claim token.
 * The resume must exist, have claimed=false, and the user must be authenticated.
 * 
 * Body:
 * {
 *   token: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in to claim your resume.' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { token } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid token. Please provide a valid claim token.' },
        { status: 400 }
      )
    }

    // CLAIM STEP 1: Find resume by claim token
    console.log('CLAIM STEP 1 - TOKEN:', token)
    const { data: existingResume, error: fetchError } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .eq('claim_token', token)
      .eq('claimed', false)
      .maybeSingle()

    console.log('CLAIM STEP 1 - FOUND RESUME:', existingResume)

    if (fetchError) {
      console.error('❌ Error fetching resume by claim token:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve resume. Please try again.' },
        { status: 500 }
      )
    }

    if (!existingResume) {
      return NextResponse.json(
        {
          success: false,
          error: 'This resume has already been claimed.'
        },
        { status: 400 }
      )
    }

    // Get Supabase user
    const userResult = await getUserByClerkId(userId)

    if (!userResult.success || !userResult.data) {
      console.error('❌ Could not find Supabase user for Clerk ID:', userId)
      return NextResponse.json(
        { success: false, error: 'User profile not found. Please ensure your account is properly set up.' },
        { status: 404 }
      )
    }

    const supabaseUserId = userResult.data.id

    // CLAIM STEP 2: Update resume using claim_token to ensure correct WHERE clause
    const { data: updatedResume, error: updateError } = await supabaseAdmin
      .from('resumes')
      .update({
        claimed: true,
        user_id: supabaseUserId
      })
      .eq('claim_token', token)
      .select()
      .single()

    console.log('CLAIM STEP 2 - UPDATED RESUME:', updatedResume)
    console.log('CLAIM STEP 2 - ERROR:', updateError)

    if (updateError) {
      console.error('❌ Error updating resume:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to claim resume. Please try again.' },
        { status: 500 }
      )
    }

    console.log('✅ Resume claimed successfully:', updatedResume.id, 'by user:', supabaseUserId)

    return NextResponse.json(
      {
        success: true,
        data: {
          resumeId: updatedResume.id,
          resume: updatedResume,
          message: 'Resume claimed successfully!'
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Unexpected error in claim endpoint:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
