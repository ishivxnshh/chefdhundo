import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseAdminClient } from '@/lib/supabase/supabase'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const resumeId = body?.resumeId as string | undefined
    if (!resumeId) {
      return NextResponse.json({ success: false, error: 'resumeId required' }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()

    const { data: userRow, error: userErr } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()
    if (userErr || !userRow) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const { data: resumeRow, error: resumeErr } = await supabase
      .from('resumes')
      .select('user_id, resume_file')
      .eq('id', resumeId)
      .single()
    if (resumeErr || !resumeRow) {
      return NextResponse.json({ success: false, error: 'Resume not found' }, { status: 404 })
    }

    if (resumeRow.user_id !== userRow.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    if (resumeRow.resume_file) {
      // Try to infer the storage key from the signed URL. Fallback to conventional path.
      const match = resumeRow.resume_file.match(/\/resumes\/(.*?)\?/) 
      const key = match?.[1] || `${userRow.id}/${resumeId}.pdf`
      const { error: delErr } = await supabase.storage.from('resumes').remove([key])
      if (delErr) {
        // Not fatal, continue to null DB field to avoid blocking UX
        console.warn('Delete storage error:', delErr.message)
      }
    }

    const { error: updErr } = await supabase
      .from('resumes')
      .update({ resume_file: null })
      .eq('id', resumeId)
    if (updErr) {
      return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Delete failed' },
      { status: 500 }
    )
  }
}
