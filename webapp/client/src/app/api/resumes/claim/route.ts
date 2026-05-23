import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/supabase'
import { getUserByClerkId, createUser } from '@/lib/supabase/database'
import type { User } from '@/types/supabase'

/**
 * POST /api/resumes/claim
 *
 * WHY THIS FILE WAS REWRITTEN
 * ───────────────────────────
 * Root cause of "user_id = NULL, claimed = false" after signup:
 *
 * The previous implementation called getUserByClerkId() and returned HTTP 404
 * if the Supabase user row didn't exist yet.  For brand-new signups, the Clerk
 * session is ready milliseconds before the AuthProvider has had a chance to
 * create the Supabase user row.  So the claim API silently returned 404, the
 * frontend logged the error, and the resume was never updated.
 *
 * Fix:
 *   If getUserByClerkId returns null, fetch the full Clerk profile via the
 *   Clerk backend SDK and create the Supabase user row right here, inline,
 *   before doing the resume update.  This makes the claim API self-sufficient
 *   and independent of the AuthProvider timing.
 *
 * Body: { token: string }
 */
export async function POST(request: NextRequest) {
  try {
    // ── STEP 1: Verify Clerk session ─────────────────────────────────────────
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      console.log('[CLAIM] ❌ No Clerk session — returning 401')
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in to claim your resume.' },
        { status: 401 }
      )
    }

    console.log('[CLAIM] ✅ Clerk user ID:', clerkUserId)

    // ── STEP 2: Parse and validate token ─────────────────────────────────────
    const body = await request.json()
    const { token } = body

    if (!token || typeof token !== 'string' || token.trim() === '') {
      console.log('[CLAIM] ❌ Missing or invalid token in request body')
      return NextResponse.json(
        { success: false, error: 'Invalid token. Please provide a valid claim token.' },
        { status: 400 }
      )
    }

    console.log('[CLAIM] 🎫 Token received:', token)

    // ── STEP 3: Find the resume by claim token ───────────────────────────────
    const { data: existingResume, error: fetchError } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .eq('claim_token', token)
      .maybeSingle()

    if (fetchError) {
      console.error('[CLAIM] ❌ Supabase error fetching resume by token:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve resume. Please try again.' },
        { status: 500 }
      )
    }

    if (!existingResume) {
      console.log('[CLAIM] ❌ No resume found for token:', token)
      return NextResponse.json(
        { success: false, error: 'Invalid or expired claim link' },
        { status: 400 }
      )
    }

    console.log('[CLAIM] 📄 Found resume — ID:', existingResume.id,
      '| claimed:', existingResume.claimed,
      '| current user_id:', existingResume.user_id)

    // ── STEP 4: Resolve Supabase user (create if missing) ───────────────────
    // This is the critical fix: for new signups, the Supabase user row may not
    // exist yet when the claim API fires.  We create it here if needed.
    let supabaseUser: User | null = null

    const lookupResult = await getUserByClerkId(clerkUserId)

    if (lookupResult.success && lookupResult.data) {
      supabaseUser = lookupResult.data
      console.log('[CLAIM] 👤 Supabase user found — ID:', supabaseUser.id,
        '| email:', supabaseUser.email,
        '| chef:', supabaseUser.chef)
    } else {
      // User row doesn't exist yet.  Fetch full profile from Clerk and create it.
      console.log('[CLAIM] ⚠️  Supabase user NOT found for Clerk ID:', clerkUserId)
      console.log('[CLAIM] 🔄 Creating Supabase user row via Clerk profile...')

      try {
        const client = await clerkClient()
        const clerkProfile = await client.users.getUser(clerkUserId)

        const primaryEmail =
          clerkProfile.emailAddresses.find(
            (e) => e.id === clerkProfile.primaryEmailAddressId
          )?.emailAddress ??
          clerkProfile.emailAddresses[0]?.emailAddress ??
          null

        if (!primaryEmail) {
          console.error('[CLAIM] ❌ Could not resolve email from Clerk profile — aborting')
          return NextResponse.json(
            { success: false, error: 'Could not resolve user email from Clerk. Please try again.' },
            { status: 500 }
          )
        }

        const fullName =
          `${clerkProfile.firstName ?? ''} ${clerkProfile.lastName ?? ''}`.trim() ||
          'Chef'

        const createResult = await createUser({
          clerk_user_id: clerkUserId,
          name: fullName,
          email: primaryEmail,
          photo: clerkProfile.imageUrl ?? null,
        })

        if (!createResult.success || !createResult.data) {
          // createUser fails with a unique-email conflict if the row was created
          // concurrently by the AuthProvider between our lookup and now.
          // Re-fetch to get the existing row.
          console.log('[CLAIM] ⚠️  createUser failed (possibly concurrent creation):', createResult.error)
          console.log('[CLAIM] 🔄 Re-fetching Supabase user after conflict...')

          const retryResult = await getUserByClerkId(clerkUserId)
          if (retryResult.success && retryResult.data) {
            supabaseUser = retryResult.data
            console.log('[CLAIM] ✅ Supabase user recovered on retry — ID:', supabaseUser.id)
          } else {
            console.error('[CLAIM] ❌ Could not create or find Supabase user — giving up')
            return NextResponse.json(
              {
                success: false,
                error:
                  'User profile could not be created. Please refresh the page and try again.',
              },
              { status: 500 }
            )
          }
        } else {
          supabaseUser = createResult.data
          console.log('[CLAIM] ✅ Supabase user created — ID:', supabaseUser.id, '| email:', supabaseUser.email)
        }
      } catch (clerkErr) {
        console.error('[CLAIM] ❌ Clerk API error while fetching profile:', clerkErr)
        return NextResponse.json(
          { success: false, error: 'Failed to resolve user profile. Please try again.' },
          { status: 500 }
        )
      }
    }

    // At this point supabaseUser is guaranteed non-null
    const supabaseUserId = supabaseUser!.id

    // ── STEP 5: Skip update only when already fully linked to THIS user ──────
    // (Idempotency guard — safe re-claims do nothing extra)
    if (existingResume.claimed === true && existingResume.user_id === supabaseUserId) {
      console.log('[CLAIM] ✅ Resume already fully linked to this user — idempotent return')

      // Ensure chef flag is set as a recovery step even in the idempotent path
      if (supabaseUser!.chef !== 'yes') {
        await supabaseAdmin.from('users').update({ chef: 'yes' }).eq('id', supabaseUserId)
        console.log('[CLAIM] 🍳 chef=yes applied (recovery in idempotent path)')
      }

      return NextResponse.json(
        {
          success: true,
          data: { resumeId: existingResume.id, resume: existingResume, message: 'Resume already claimed' },
        },
        { status: 200 }
      )
    }

    // ── STEP 6: Build the resume update payload ───────────────────────────────
    const isTempEmail = existingResume.email?.endsWith('@wa.chefdhundo.com') ?? false
    const realEmail = supabaseUser!.email ?? null

    const resumeUpdatePayload: Record<string, unknown> = {
      user_id: supabaseUserId,   // ← Critical: link resume to this user
      claimed: true,
    }

    // Replace temp WAHA email with real email if available
    if (isTempEmail && realEmail) {
      resumeUpdatePayload.email = realEmail
    }

    console.log('[CLAIM] 📦 Resume update payload:', JSON.stringify(resumeUpdatePayload))

    // ── STEP 7: Execute the resume UPDATE ────────────────────────────────────
    const { data: updatedResume, error: updateError } = await supabaseAdmin
      .from('resumes')
      .update(resumeUpdatePayload)
      .eq('claim_token', token)   // match by token (unique)
      .select()
      .single()

    if (updateError) {
      console.error('[CLAIM] ❌ Supabase error updating resume row:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to claim resume. Please try again.' },
        { status: 500 }
      )
    }

    console.log('[CLAIM] ✅ Resume row updated successfully:',
      '| ID:', updatedResume.id,
      '| user_id:', updatedResume.user_id,
      '| claimed:', updatedResume.claimed,
      '| email:', updatedResume.email)

    // ── STEP 8: Update users.chef = 'yes' ────────────────────────────────────
    // The dashboard checks currentUser.chef === 'yes' to render the resume
    // editor.  Without this, the dashboard always shows the basic info panel.
    const { data: updatedUser, error: chefUpdateError } = await supabaseAdmin
      .from('users')
      .update({ chef: 'yes' })
      .eq('id', supabaseUserId)
      .select()
      .single()

    if (chefUpdateError) {
      // Non-fatal — resume is linked.  Log clearly so it's visible in server logs.
      console.error('[CLAIM] ⚠️  Could not set users.chef=yes (non-fatal):', chefUpdateError)
    } else {
      console.log('[CLAIM] 🍳 users.chef updated to "yes" for user ID:', updatedUser?.id)
    }

    // ── STEP 9: Re-query the final resume row for the response ───────────────
    const { data: finalResume, error: finalFetchError } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .eq('id', updatedResume.id)
      .single()

    if (finalFetchError || !finalResume) {
      console.error('[CLAIM] ⚠️  Could not re-fetch resume after update (non-fatal):', finalFetchError)
      // Still return success — the update itself worked
      return NextResponse.json(
        {
          success: true,
          data: { resumeId: updatedResume.id, resume: updatedResume, message: 'Resume claimed successfully!' },
        },
        { status: 200 }
      )
    }

    console.log('[CLAIM] 🏁 Final resume state —', JSON.stringify({
      id: finalResume.id,
      user_id: finalResume.user_id,
      claimed: finalResume.claimed,
      email: finalResume.email,
    }))

    return NextResponse.json(
      {
        success: true,
        data: { resumeId: finalResume.id, resume: finalResume, message: 'Resume claimed successfully!' },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[CLAIM] ❌ Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
