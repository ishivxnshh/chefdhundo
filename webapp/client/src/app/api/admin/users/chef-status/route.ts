import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserByClerkId, updateUserById } from '@/lib/supabase/database'

/**
 * PATCH /api/admin/users/chef-status
 * Update a user's chef status (admin only)
 * Body: { userId: string, chef: 'yes' | 'no' }
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get current user from Clerk
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify admin role
    const currentUserResult = await getUserByClerkId(clerkUserId)
    
    if (!currentUserResult.success || !currentUserResult.data) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    if (currentUserResult.data.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Get request body
    const body = await request.json()
    const { userId, chef } = body

    if (!userId || !chef) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, chef' },
        { status: 400 }
      )
    }

    if (chef !== 'yes' && chef !== 'no') {
      return NextResponse.json(
        { success: false, error: 'Invalid chef status. Must be "yes" or "no"' },
        { status: 400 }
      )
    }

    // Update chef status
    const result = await updateUserById(userId, { chef })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to update chef status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: `Chef status updated to "${chef}"`
    })

  } catch (error) {
    console.error('Error in PATCH /api/admin/users/chef-status:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
