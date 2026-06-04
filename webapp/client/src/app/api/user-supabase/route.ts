import { NextRequest, NextResponse } from 'next/server'
import {
  getUserByClerkId,
  updateUser,
  createUser,
  getUserByEmail,
  updateUserByEmail
} from '@/lib/supabase/database'
import type { UserUpdate } from '@/types/supabase'
import { ClerkUserData } from '@/types/supabase'
import { ensureUserForPhone, syntheticIdToPhone } from '@/lib/auth/server'
import { auth } from '@clerk/nextjs/server'

async function authorizeUserTarget(targetUserId: string) {
  const { userId } = await auth()
  if (!userId) return { allowed: false, isAdmin: false }

  if (userId === targetUserId) {
    return { allowed: true, isAdmin: false }
  }

  const requester = await getUserByClerkId(userId)
  const isAdmin = requester.success && requester.data?.role === 'admin'
  return { allowed: isAdmin || userId === targetUserId, isAdmin }
}

function isMissingUsersTableError(error: string | undefined): boolean {
  if (!error) return false
  const normalized = error.toLowerCase()
  return normalized.includes("could not find the table 'public.users'")
}

function isUsersPermissionError(error: string | undefined): boolean {
  if (!error) return false
  const normalized = error.toLowerCase()
  return normalized.includes('permission denied') && normalized.includes('users')
}

// GET /api/user-supabase?clerk_id=xxx
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clerkId = searchParams.get('clerk_id')

    if (!clerkId) {
      return NextResponse.json(
        { success: false, error: 'clerk_id is required' },
        { status: 400 }
      )
    }

    const authorization = await authorizeUserTarget(clerkId)
    if (!authorization.allowed) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const phone = syntheticIdToPhone(clerkId)
    if (phone) {
      const user = await ensureUserForPhone(phone)
      return NextResponse.json({
        success: true,
        data: user
      })
    }

    const result = await getUserByClerkId(clerkId)
    
    if (!result.success) {
      if (isMissingUsersTableError(result.error)) {
        return NextResponse.json(
          {
            success: true,
            data: null,
            schemaReady: false,
            message: 'Users table is not initialized in Supabase yet',
          },
          { status: 200 }
        )
      }

      if (isUsersPermissionError(result.error)) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: 'Supabase role cannot read users table. Check RLS policies or SUPABASE_SERVICE_ROLE in deployment env.',
            schemaReady: false,
          },
          { status: 503 }
        )
      }

      // Return 200 with success: false for "user not found" cases
      // This allows the frontend to handle it gracefully
      return NextResponse.json(
        { success: false, error: result.error, data: null },
        { status: 200 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })
  } catch (error) {
    console.error('Error in GET /api/user-supabase:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/user-supabase - Create user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clerk_user_id, name, email, photo } = body

    if (!clerk_user_id || !name || !email) {
      return NextResponse.json(
        { success: false, error: 'clerk_user_id, name, and email are required' },
        { status: 400 }
      )
    }

    const authorization = await authorizeUserTarget(clerk_user_id)
    if (!authorization.allowed) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const userData: ClerkUserData = {
      clerk_user_id,
      name,
      email,
      photo: photo || null
    }

    const result = await createUser(userData)

    if (!result.success) {
      const errorMessage = result.error || 'Failed to create user'

      if (isMissingUsersTableError(errorMessage)) {
        return NextResponse.json(
          {
            success: false,
            schemaReady: false,
            error: 'Users table is not initialized in Supabase yet',
          },
          { status: 503 }
        )
      }

      if (isUsersPermissionError(errorMessage)) {
        return NextResponse.json(
          {
            success: false,
            schemaReady: false,
            error: 'Supabase role cannot write users table. Check RLS policies or SUPABASE_SERVICE_ROLE in deployment env.',
          },
          { status: 503 }
        )
      }

      if (errorMessage.includes('users_email_key')) {
        const existingUser = await getUserByEmail(email)

        if (existingUser.success && existingUser.data) {
          const updates: Partial<UserUpdate> = {}

          if (existingUser.data.clerk_user_id !== clerk_user_id) {
            updates.clerk_user_id = clerk_user_id
          }

          const trimmedName = name.trim()
          if (trimmedName && trimmedName !== existingUser.data.name) {
            updates.name = trimmedName
          }

          if (photo !== undefined) {
            const normalizedPhoto = photo ?? null
            if (normalizedPhoto !== existingUser.data.photo) {
              updates.photo = normalizedPhoto
            }
          }

          const reconciliation = Object.keys(updates).length > 0
            ? await updateUserByEmail(email, updates)
            : existingUser

          if (reconciliation.success && reconciliation.data) {
            return NextResponse.json(
              { success: true, data: reconciliation.data, reconciled: true },
              { status: 200 }
            )
          }

          return NextResponse.json(
            { success: false, error: reconciliation.error || 'Failed to reconcile existing user' },
            { status: 400 }
          )
        }

        return NextResponse.json(
          { success: false, error: 'User with this email already exists but could not be fetched' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: true, data: result.data },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/user-supabase:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/user-supabase - Update user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { clerk_user_id, ...updates } = body

    if (!clerk_user_id) {
      return NextResponse.json(
        { success: false, error: 'clerk_user_id is required' },
        { status: 400 }
      )
    }

    const authorization = await authorizeUserTarget(clerk_user_id)
    if (!authorization.allowed) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    if (!authorization.isAdmin) {
      const allowedSelfUpdates = new Set(['name', 'photo', 'chef'])
      for (const key of Object.keys(updates)) {
        if (!allowedSelfUpdates.has(key)) {
          return NextResponse.json(
            { success: false, error: 'Forbidden update field' },
            { status: 403 }
          )
        }
      }
    }

    const result = await updateUser(clerk_user_id, updates)
    
    if (!result.success) {
      if (isMissingUsersTableError(result.error)) {
        return NextResponse.json(
          {
            success: false,
            schemaReady: false,
            error: 'Users table is not initialized in Supabase yet',
          },
          { status: 503 }
        )
      }

      if (isUsersPermissionError(result.error)) {
        return NextResponse.json(
          {
            success: false,
            schemaReady: false,
            error: 'Supabase role cannot update users table. Check RLS policies or SUPABASE_SERVICE_ROLE in deployment env.',
          },
          { status: 503 }
        )
      }

      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })
  } catch (error) {
    console.error('Error in PUT /api/user-supabase:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
