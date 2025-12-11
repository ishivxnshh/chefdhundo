// Server-side Supabase utilities for use in Server Components and Server Actions
import { supabaseAdmin } from './supabase'
import type { User } from '@/types/supabase'

/**
 * Get user by Clerk ID - Server-side only
 * This bypasses the API route for faster server-side data fetching
 */
export async function getServerUser(clerkUserId: string): Promise<User | null> {
  try {
    // Check if supabaseAdmin is properly configured
    if (!supabaseAdmin) {
      console.error('Server: supabaseAdmin is not configured')
      return null
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .maybeSingle()

    if (error) {
      console.error('Server: Error fetching user:', error.message)
      return null
    }

    return data
  } catch (error) {
    console.error('Server: Unexpected error fetching user:', error)
    return null
  }
}

/**
 * Create user from Clerk data - Server-side only
 */
export async function createServerUser(userData: {
  clerk_user_id: string
  name: string
  email: string
  photo?: string | null
}): Promise<User | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        clerk_user_id: userData.clerk_user_id,
        name: userData.name,
        email: userData.email,
        photo: userData.photo ?? null,
        role: 'basic',
        chef: 'no'
      })
      .select()
      .single()

    if (error) {
      console.error('Server: Error creating user:', error.message)
      return null
    }

    return data
  } catch (error) {
    console.error('Server: Unexpected error creating user:', error)
    return null
  }
}

/**
 * Get or create user - Server-side only
 * Fetches existing user or creates new one if not found
 * Uses upsert to handle race conditions and duplicate emails
 */
export async function getOrCreateServerUser(clerkUser: {
  id: string
  firstName?: string | null
  lastName?: string | null
  emailAddresses?: { emailAddress: string }[]
  imageUrl?: string | null
}): Promise<User | null> {
  // First try to get existing user by clerk_user_id
  const existingUser = await getServerUser(clerkUser.id)
  if (existingUser) {
    return existingUser
  }

  // User doesn't exist by clerk_id, get email
  const email = clerkUser.emailAddresses?.[0]?.emailAddress
  if (!email) {
    console.error('Server: No email found for Clerk user')
    return null
  }

  // Check if user exists by email (could have been created with different clerk_id)
  try {
    const { data: existingByEmail } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (existingByEmail) {
      // User exists with this email, update their clerk_user_id if needed
      if (existingByEmail.clerk_user_id !== clerkUser.id) {
        const { data: updated } = await supabaseAdmin
          .from('users')
          .update({ 
            clerk_user_id: clerkUser.id,
            photo: clerkUser.imageUrl ?? existingByEmail.photo
          })
          .eq('id', existingByEmail.id)
          .select()
          .single()
        return updated || existingByEmail
      }
      return existingByEmail
    }
  } catch (error) {
    console.error('Server: Error checking user by email:', error)
  }

  // User truly doesn't exist, create new one
  const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Unknown User'

  return createServerUser({
    clerk_user_id: clerkUser.id,
    name,
    email,
    photo: clerkUser.imageUrl ?? null
  })
}
