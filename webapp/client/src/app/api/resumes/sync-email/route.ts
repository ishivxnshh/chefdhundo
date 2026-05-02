import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/supabase'
import { getUserByClerkId } from '@/lib/supabase/database'

const TEMP_EMAIL_SUFFIX = '@wa.chefdhundo.com'

/**
 * POST /api/resumes/sync-email
 *
 * Idempotent endpoint that replaces a WAHA-generated temp email
 * (e.g. "<phone>@wa.chefdhundo.com") with the authenticated user's
 * real email on their claimed resume.
 *
 * - Called silently from the dashboard after login.
 * - Does nothing if the resume already has a real email.
 * - Picks the most recent resume if multiple exist for the user.
 * - No request body required.
 */
export async function POST(_request: NextRequest) {
  try {
    // 1. Require authentication
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Fetch the Supabase user to get both the real email and supabase user id
    const userResult = await getUserByClerkId(userId)

    if (!userResult.success || !userResult.data) {
      console.error('❌ Sync-Email: Could not find Supabase user for Clerk ID:', userId)
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    const supabaseUserId = userResult.data.id
    const realEmail = userResult.data.email

    if (!realEmail) {
      console.warn('⚠️ Sync-Email: User has no email in Supabase profile, skipping')
      return NextResponse.json({
        success: true,
        updated: false,
        message: 'No real email available on user profile',
      })
    }

    // 3. Fetch the most recent claimed resume for this user
    const { data: resumes, error: fetchError } = await supabaseAdmin
      .from('resumes')
      .select('id, email')
      .eq('user_id', supabaseUserId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (fetchError) {
      console.error('❌ Sync-Email: Error fetching resume for user:', supabaseUserId, fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch resume' },
        { status: 500 }
      )
    }

    if (!resumes || resumes.length === 0) {
      console.log('ℹ️ Sync-Email: No resume found for user:', supabaseUserId)
      return NextResponse.json({
        success: true,
        updated: false,
        message: 'No resume found for this user',
      })
    }

    const resume = resumes[0]
    const currentEmail = resume.email as string | null
    const isTempEmail = currentEmail?.endsWith(TEMP_EMAIL_SUFFIX) ?? false

    // 4. Skip if the email is already real
    if (!isTempEmail) {
      console.log(`ℹ️ Sync-Email: Resume [${resume.id}] already has a real email [${currentEmail}], skipping`)
      return NextResponse.json({
        success: true,
        updated: false,
        message: 'Email is already up to date',
      })
    }

    // 5. Atomically update the email field only
    console.log(`📧 Sync-Email: Replacing temp email [${currentEmail}] with real email [${realEmail}] on resume [${resume.id}]`)

    const { data: updatedResume, error: updateError } = await supabaseAdmin
      .from('resumes')
      .update({ email: realEmail })
      .eq('id', resume.id)
      .eq('user_id', supabaseUserId) // extra guard: only update if it belongs to this user
      .select()
      .single()

    if (updateError) {
      console.error('❌ Sync-Email: Error updating email on resume:', resume.id, updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update resume email' },
        { status: 500 }
      )
    }

    console.log(`✅ Sync-Email: Successfully updated email on resume [${resume.id}] to [${realEmail}]`)

    return NextResponse.json({
      success: true,
      updated: true,
      resume: updatedResume,
      message: `Email updated from ${currentEmail} to ${realEmail}`,
    })
  } catch (error) {
    console.error('❌ Sync-Email: Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
