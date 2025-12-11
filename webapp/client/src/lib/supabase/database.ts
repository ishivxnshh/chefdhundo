import { supabaseAdmin } from './supabase'
import {
  User,
  UserUpdate,
  Resume,
  ResumeInsert,
  ResumeUpdate,
  UserWithResume,
  ClerkUserData,
  ApiResponse
} from '@/types/supabase'

// ==================== USER OPERATIONS ====================

/**
 * Create a new user from Clerk webhook data
 */
export async function createUser(userData: ClerkUserData): Promise<ApiResponse<User>> {
  try {

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        clerk_user_id: userData.clerk_user_id,
        name: userData.name,
        email: userData.email,
        photo: userData.photo,
        role: 'basic', // Default role
        chef: 'no' // Default chef status
      })
      .select()
      .single()

    if (error) {

      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error creating user:', error)
    return { success: false, error: 'Failed to create user' }
  }
}

/**
 * Get user by Clerk user ID
 */
export async function getUserByClerkId(clerkUserId: string): Promise<ApiResponse<User>> {
  try {

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .maybeSingle() // Use maybeSingle() instead of single() to handle 0 or 1 rows

    if (error) {

      return { success: false, error: error.message }
    }

    if (!data) {
      // User not found - this is not an error, just no user exists yet
      return { success: false, error: 'User not found in database' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error fetching user by Clerk ID:', error)
    return { success: false, error: 'Failed to fetch user' }
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<ApiResponse<User>> {
  try {

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {

      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error fetching user by email:', error)
    return { success: false, error: 'Failed to fetch user' }
  }
}

/**
 * Update user information
 */
export async function updateUser(clerkUserId: string, updates: UserUpdate): Promise<ApiResponse<User>> {
  try {

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('clerk_user_id', clerkUserId)
      .select()
      .single()

    if (error) {

      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error updating user:', error)
    return { success: false, error: 'Failed to update user' }
  }
}

/**
 * Update user by Supabase user ID (admin function)
 */
export async function updateUserById(userId: string, updates: UserUpdate): Promise<ApiResponse<User>> {
  try {
    console.log('🔄 Database: Updating user with ID:', userId, 'Updates:', updates)

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('❌ Database: Error updating user:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Database: User updated successfully')
    return { success: true, data }
  } catch (error) {
    console.error('❌ Database: Unexpected error updating user:', error)
    return { success: false, error: 'Failed to update user' }
  }
}

/**
 * Delete user (admin function)
 * WARNING: This will cascade delete all related data (resumes, payments, subscriptions)
 */
export async function deleteUser(userId: string): Promise<ApiResponse<null>> {
  try {
    console.log('🗑️ Database: Deleting user with ID:', userId)

    // Check if user exists before deleting
    const { error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('❌ Database: Error fetching user for deletion:', userError)
      return { success: false, error: userError.message }
    }

    // Delete the user (cascade will handle related records)
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) {
      console.error('❌ Database: Error deleting user:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Database: User deleted successfully')
    return { success: true, data: null }
  } catch (error) {
    console.error('❌ Database: Unexpected error deleting user:', error)
    return { success: false, error: 'Failed to delete user' }
  }
}

/**
 * Get all users (admin function)
 */
export async function getAllUsers(): Promise<ApiResponse<User[]>> {
  try {

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error fetching users:', error)
    return { success: false, error: 'Failed to fetch users' }
  }
}

/**
 * Get all chefs
 */
export async function getAllChefs(): Promise<ApiResponse<User[]>> {
  try {

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('chef', 'yes')
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error fetching chefs:', error)
    return { success: false, error: 'Failed to fetch chefs' }
  }
}

// ==================== RESUME OPERATIONS ====================

/**
 * Create a new resume
 */
export async function createResume(resumeData: ResumeInsert): Promise<ApiResponse<Resume>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('resumes')
      .insert(resumeData)
      .select()
      .single()

    if (error) {
      console.error('Error creating resume:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error creating resume:', error)
    return { success: false, error: 'Failed to create resume' }
  }
}

/**
 * Get resume by user ID (single resume)
 */
export async function getResumeByUserId(userId: string): Promise<ApiResponse<Resume>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error fetching resume:', error)
    return { success: false, error: 'Failed to fetch resume' }
  }
}

/**
 * Get all resumes by user ID (multiple resumes)
 */
export async function getResumesByUserId(userId: string): Promise<ApiResponse<Resume[]>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error fetching resumes:', error)
    return { success: false, error: 'Failed to fetch resumes' }
  }
}

/**
 * Update resume
 */
export async function updateResume(resumeId: string, updates: ResumeUpdate): Promise<ApiResponse<Resume>> {
  try {
    console.log('🔄 Database: Updating resume with ID:', resumeId, 'Updates:', updates)
    
    const { data, error } = await supabaseAdmin
      .from('resumes')
      .update(updates)
      .eq('id', resumeId)
      .select()
      .single()

    if (error) {
      console.error('❌ Database: Error updating resume:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Database: Resume updated successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('❌ Database: Unexpected error updating resume:', error)
    return { success: false, error: 'Failed to update resume' }
  }
}

/**
 * Get all resumes (admin function)
 */
export async function getAllResumes(): Promise<ApiResponse<Resume[]>> {
  try {
    console.log('🔍 Database: Fetching all resumes using admin client...')
    
    const { data, error } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Database: Error fetching resumes:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Database: Successfully fetched resumes:', data?.length || 0)
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('❌ Database: Unexpected error fetching resumes:', error)
    return { success: false, error: 'Failed to fetch resumes' }
  }
}

/**
 * Pagination response type
 */
interface PaginatedResponse<T> {
  success: boolean
  data?: T
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
  error?: string
}

/**
 * Get all resumes with server-side pagination and filtering
 * This is optimized for large datasets - only fetches what's needed
 */
export async function getAllResumesPaginated(options: {
  page: number
  limit: number
  search?: string
  experience?: string
  profession?: string
}): Promise<PaginatedResponse<Resume[]>> {
  try {
    const { page, limit, search, experience, profession } = options
    const offset = (page - 1) * limit

    console.log('🔍 Database: Fetching paginated resumes...', { page, limit, search, experience, profession })

    // Build the base query
    let query = supabaseAdmin
      .from('resumes')
      .select('*', { count: 'exact' })

    // Apply search filter (name, email, phone, profession)
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase()
      query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,profession.ilike.%${searchTerm}%,work_type.ilike.%${searchTerm}%`)
    }

    // Apply experience filter
    if (experience && experience !== 'all') {
      switch (experience) {
        case 'fresher':
          query = query.lt('experience_years', 3)
          break
        case 'medium':
          query = query.gte('experience_years', 3).lte('experience_years', 6)
          break
        case 'high':
          query = query.gt('experience_years', 6).lte('experience_years', 10)
          break
        case 'pro':
          query = query.gt('experience_years', 10)
          break
      }
    }

    // Apply profession filter
    if (profession && profession !== 'all') {
      query = query.or(`profession.eq.${profession},work_type.eq.${profession},job_role.eq.${profession}`)
    }

    // Apply ordering and pagination
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('❌ Database: Error fetching paginated resumes:', error)
      return { success: false, error: error.message }
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    console.log('✅ Database: Successfully fetched paginated resumes:', {
      fetched: data?.length || 0,
      total,
      page,
      totalPages
    })

    return {
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages
      }
    }
  } catch (error) {
    console.error('❌ Database: Unexpected error fetching paginated resumes:', error)
    return { success: false, error: 'Failed to fetch resumes' }
  }
}

/**
 * Search resumes by criteria
 */
export async function searchResumes(criteria: {
  location?: string
  profession?: string
  experience?: number
  cuisines?: string[]
}): Promise<ApiResponse<Resume[]>> {
  try {
    let query = supabaseAdmin
      .from('resumes')
      .select('*')

    if (criteria.location) {
      query = query.or(`city.ilike.%${criteria.location}%,user_location.ilike.%${criteria.location}%,preferred_location.ilike.%${criteria.location}%`)
    }

    if (criteria.profession) {
      query = query.or(`profession.ilike.%${criteria.profession}%,job_role.ilike.%${criteria.profession}%`)
    }

    if (criteria.experience !== undefined) {
      query = query.gte('experience_years', criteria.experience)
    }

    if (criteria.cuisines && criteria.cuisines.length > 0) {
      // Search in cuisines field using OR conditions for multiple cuisines
      const cuisineConditions = criteria.cuisines.map(cuisine => `cuisines.ilike.%${cuisine}%`).join(',')
      query = query.or(cuisineConditions)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error searching resumes:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error searching resumes:', error)
    return { success: false, error: 'Failed to search resumes' }
  }
}

/**
 * Delete resume
 */
export async function deleteResume(resumeId: string): Promise<ApiResponse<null>> {
  try {
    console.log('🗑️ Database: Deleting resume with ID:', resumeId)
    
    const { error } = await supabaseAdmin  // ✅ Changed from supabase to supabaseAdmin
      .from('resumes')
      .delete()
      .eq('id', resumeId)

    if (error) {
      console.error('❌ Database: Error deleting resume:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Database: Resume deleted successfully')
    return { success: true, data: null }
  } catch (error) {
    console.error('❌ Database: Unexpected error deleting resume:', error)
    return { success: false, error: 'Failed to delete resume' }
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Upsert user (create if not exists, update if exists)
 */
export async function upsertUser(userData: ClerkUserData): Promise<ApiResponse<User>> {
  try {
    // Try to get existing user first
    const existingUser = await getUserByClerkId(userData.clerk_user_id)
    
    if (existingUser.success && existingUser.data) {
      // Update existing user
      const updateData: UserUpdate = {
        name: userData.name,
        email: userData.email,
        photo: userData.photo
      }
      return await updateUser(userData.clerk_user_id, updateData)
    } else {
      // Create new user
      return await createUser(userData)
    }
  } catch (error) {
    console.error('Unexpected error upserting user:', error)
    return { success: false, error: 'Failed to upsert user' }
  }
}

/**
 * Get user with their resume data
 */
export async function getUserWithResume(clerkUserId: string): Promise<ApiResponse<UserWithResume>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        resumes (*)
      `)
      .eq('clerk_user_id', clerkUserId)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error fetching user with resume:', error)
    return { success: false, error: 'Failed to fetch user with resume' }
  }
}

/**
 * Update a user record identified by email
 */
export async function updateUserByEmail(email: string, updates: Partial<UserUpdate>): Promise<ApiResponse<User>> {
  try {
    const payload = Object.fromEntries(
      Object.entries({ ...updates }).filter(([, value]) => value !== undefined)
    ) as UserUpdate

    if (Object.keys(payload).length === 0) {
      const existing = await getUserByEmail(email)
      return existing
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(payload)
      .eq('email', email)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error updating user by email:', error)
    return { success: false, error: 'Failed to update user' }
  }
}