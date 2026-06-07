import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'
import { createSupabaseAdminClient } from '@/lib/supabase/supabase'

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const adminClient = createSupabaseAdminClient()

    // Check if requester is admin
    const { data: me, error: meErr } = await adminClient
      .from('users')
      .select('role')
      .eq('clerk_user_id', userId)
      .maybeSingle()

    if (meErr) {
      return NextResponse.json({ success: false, error: meErr.message }, { status: 500 })
    }

    if (me?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden - Admin only' }, { status: 403 })
    }

    // Get request body
    const body = await request.json()
    const { targetUserId, newRole } = body

    if (!targetUserId || !newRole) {
      return NextResponse.json(
        { success: false, error: 'targetUserId and newRole are required' },
        { status: 400 }
      )
    }

    // Validate newRole
    if (!['basic', 'pro', 'admin'].includes(newRole)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be basic, pro, or admin' },
        { status: 400 }
      )
    }

    // Update user role
    const { data, error } = await adminClient
      .from('users')
      .update({ role: newRole })
      .eq('id', targetUserId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      message: `User role updated to ${newRole}`
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unexpected server error'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
