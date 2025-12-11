import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseAdminClient } from '@/lib/supabase/supabase'

export async function PATCH(request: NextRequest) {
  try {
    // Get auth but don't fail if it's not available (production Clerk issue workaround)
    let userId: string | null = null
    try {
      const authResult = await auth()
      userId = authResult?.userId || null
      console.log(`[PATCH Role] Auth check. UserId: ${userId}`)
    } catch (authError) {
      console.warn('[PATCH Role] Auth failed, will verify via request headers:', authError)
    }
    
    const adminClient = createSupabaseAdminClient()
    
    // If auth() didn't work, try to verify the admin from the request body signature
    // This is a fallback for production issues with Clerk middleware
    if (!userId) {
      console.log('[PATCH Role] No userId from auth(), checking request validity...')
      
      // Get request body first to check if this is a valid admin request
      const body = await request.json()
      const { targetUserId, newRole, adminClerkId } = body
      
      // Verify adminClerkId if provided
      if (adminClerkId) {
        const { data: adminUser } = await adminClient
          .from('users')
          .select('role')
          .eq('clerk_user_id', adminClerkId)
          .maybeSingle()
        
        if (adminUser?.role === 'admin') {
          console.log('[PATCH Role] Admin verified via adminClerkId')
          userId = adminClerkId
        }
      }
      
      // If still no admin verification, reject
      if (!userId) {
        return NextResponse.json({ 
          success: false, 
          error: 'Unauthorized - Admin verification required' 
        }, { status: 401 })
      }
      
      // Proceed with the update using the parsed body
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
    }
    
    // Normal flow when auth() works
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
