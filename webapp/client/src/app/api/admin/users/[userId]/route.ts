import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserByClerkId, deleteUser } from '@/lib/supabase/database'

/**
 * DELETE /api/admin/users/[userId]
 * Delete a user (admin only)
 * Cascades to delete all related resumes, payments, and subscriptions
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
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

    // Get userId from params
    const { userId } = await params

    // Prevent self-deletion
    if (currentUserResult.data.id === userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Delete the user
    const result = await deleteUser(userId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to delete user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('Error in DELETE /api/admin/users/[userId]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
