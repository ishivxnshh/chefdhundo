import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseAdminClient } from '@/lib/supabase/supabase'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPE = 'application/pdf'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user with Clerk
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const resumeId = formData.get('resumeId') as string | null

    // Validate inputs
    if (!file || !resumeId) {
      return NextResponse.json(
        { success: false, error: 'Missing file or resumeId' },
        { status: 400 }
      )
    }

    // Validate file type
    if (file.type !== ALLOWED_FILE_TYPE) {
      return NextResponse.json(
        { success: false, error: 'Only PDF files are allowed' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    console.log('📤 Upload request:', {
      userId,
      resumeId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    })

    const supabaseAdmin = createSupabaseAdminClient()

    // Verify resume ownership
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

    // Verify user owns this resume
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (userError || !user) {
      console.error('❌ User not found:', userError)
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    if (resume.user_id !== user.id) {
      console.error('❌ Unauthorized: User does not own this resume')
      return NextResponse.json(
        { success: false, error: 'Unauthorized - You do not own this resume' },
        { status: 403 }
      )
    }

    // Delete old file if exists
    if (resume.resume_file) {
      try {
        // Extract path from old URL (handle both storage paths and signed URLs)
        const oldPath = `${user.id}/${resumeId}.pdf`
        console.log('🗑️ Attempting to delete old file:', oldPath)
        
        const { error: deleteError } = await supabaseAdmin.storage
          .from('resumes')
          .remove([oldPath])

        if (deleteError) {
          console.warn('⚠️ Could not delete old file:', deleteError.message)
          // Don't fail the upload if old file deletion fails
        } else {
          console.log('✅ Old file deleted successfully')
        }
      } catch (deleteErr) {
        console.warn('⚠️ Error deleting old file:', deleteErr)
        // Continue with upload
      }
    }

    // Convert File to ArrayBuffer for upload
    const fileBuffer = await file.arrayBuffer()
    const fileBytes = new Uint8Array(fileBuffer)

    // Upload new file to Supabase Storage
    const filePath = `${user.id}/${resumeId}.pdf`
    console.log('📤 Uploading file to:', filePath)

    const { error: uploadError } = await supabaseAdmin.storage
      .from('resumes')
      .upload(filePath, fileBytes, {
        contentType: ALLOWED_FILE_TYPE,
        upsert: true, // Overwrite if exists
      })

    if (uploadError) {
      console.error('❌ Upload error:', uploadError)
      return NextResponse.json(
        { success: false, error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ File uploaded successfully')

    // Generate signed URL (60-day expiry)
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('resumes')
      .createSignedUrl(filePath, 60 * 24 * 60 * 60) // 60 days in seconds

    if (signedUrlError || !signedUrlData) {
      console.error('❌ Signed URL error:', signedUrlError)
      return NextResponse.json(
        { success: false, error: 'Failed to generate download URL' },
        { status: 500 }
      )
    }

    console.log('✅ Signed URL generated')

    // Update resume record with signed URL
    const { error: updateError } = await supabaseAdmin
      .from('resumes')
      .update({ resume_file: signedUrlData.signedUrl })
      .eq('id', resumeId)

    if (updateError) {
      console.error('❌ Database update error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update resume record' },
        { status: 500 }
      )
    }

    console.log('✅ Resume record updated with signed URL')

    return NextResponse.json({
      success: true,
      url: signedUrlData.signedUrl,
      path: filePath,
      message: 'Resume uploaded successfully'
    })

  } catch (error) {
    console.error('❌ Unexpected error in upload route:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      },
      { status: 500 }
    )
  }
}
