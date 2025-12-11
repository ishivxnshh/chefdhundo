import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseAdminClient } from '@/lib/supabase/supabase'

export async function GET(request: NextRequest) {
  try {
    // Authenticate user with Clerk
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Get resumeId from query params
    const { searchParams } = new URL(request.url)
    const resumeId = searchParams.get('resumeId')

    if (!resumeId) {
      return NextResponse.json(
        { success: false, error: 'Missing resumeId parameter' },
        { status: 400 }
      )
    }

    console.log('📥 Download URL request:', { userId, resumeId })

    const supabaseAdmin = createSupabaseAdminClient()

    // Get current user's Supabase ID
    const { data: currentUser, error: currentUserError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('clerk_user_id', userId)
      .single()

    if (currentUserError || !currentUser) {
      console.error('❌ Current user not found:', currentUserError)
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Get resume details
    const { data: resume, error: resumeError } = await supabaseAdmin
      .from('resumes')
      .select('user_id, resume_file')
      .eq('id', resumeId)
      .single()

    if (resumeError || !resume) {
      console.error('❌ Resume not found:', resumeError)
      return NextResponse.json(
        { success: false, error: 'Resume not found' },
        { status: 404 }
      )
    }

    // Check access permissions
    // User can access if they own the resume OR they are admin/pro
    const isOwner = resume.user_id === currentUser.id
    const isAdminOrPro = currentUser.role === 'admin' || currentUser.role === 'pro'

    if (!isOwner && !isAdminOrPro) {
      console.error('❌ Unauthorized: User cannot access this resume')
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Upgrade to Pro to view resumes' },
        { status: 403 }
      )
    }

    // Check if resume file exists
    if (!resume.resume_file) {
      return NextResponse.json(
        { success: false, error: 'No resume file uploaded for this resume' },
        { status: 404 }
      )
    }

    // Extract user_id from resume to construct storage path
    const { data: resumeOwner, error: ownerError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', resume.user_id)
      .single()

    if (ownerError || !resumeOwner) {
      console.error('❌ Resume owner not found:', ownerError)
      return NextResponse.json(
        { success: false, error: 'Resume owner not found' },
        { status: 404 }
      )
    }

    // Construct storage path
    const filePath = `${resumeOwner.id}/${resumeId}.pdf`
    console.log('📥 Generating signed URL for:', filePath)

    // Generate fresh signed URL (1-hour expiry for downloads)
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('resumes')
      .createSignedUrl(filePath, 60 * 60) // 1 hour in seconds

    if (signedUrlError || !signedUrlData) {
      console.error('❌ Signed URL generation error:', signedUrlError)
      return NextResponse.json(
        { success: false, error: 'Failed to generate download URL' },
        { status: 500 }
      )
    }

    console.log('✅ Signed URL generated successfully')

    return NextResponse.json({
      success: true,
      url: signedUrlData.signedUrl,
      expiresIn: 3600 // 1 hour in seconds
    })

  } catch (error) {
    console.error('❌ Unexpected error in download route:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate download URL' 
      },
      { status: 500 }
    )
  }
}
