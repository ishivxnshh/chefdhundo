import { supabaseAdmin } from './supabase'
import {
  User,
  UserUpdate,
  Resume,
  ResumeInsert,
  ResumeUpdate,
  UserWithResume,
  MobileUserData,
  ApiResponse
} from '@/types/supabase'

// ==================== USER OPERATIONS ====================

export async function createUser(userData: MobileUserData): Promise<ApiResponse<User>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        clerk_user_id: userData.clerk_user_id,
        name: userData.name,
        photo: userData.photo,
        role: 'basic',
        chef: 'no'
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error creating user:', error)
    return { success: false, error: 'Failed to create user' }
  }
}

/**
 * Compatibility lookup for the existing users.clerk_user_id column.
 * Mobile identities are stored as phone:+91XXXXXXXXXX.
 */
export async function getUserByIdentityId(identityId: string): Promise<ApiResponse<User>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_user_id', identityId)
      .maybeSingle()

    if (error) return { success: false, error: error.message }
    if (!data) return { success: false, error: 'User not found in database' }
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error fetching user by identity ID:', error)
    return { success: false, error: 'Failed to fetch user' }
  }
}

export async function updateUser(identityId: string, updates: UserUpdate): Promise<ApiResponse<User>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('clerk_user_id', identityId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error updating user:', error)
    return { success: false, error: 'Failed to update user' }
  }
}

export async function updateUserById(userId: string, updates: UserUpdate): Promise<ApiResponse<User>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error updating user:', error)
    return { success: false, error: 'Failed to update user' }
  }
}

export async function deleteUser(userId: string): Promise<ApiResponse<null>> {
  try {
    const { error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (userError) return { success: false, error: userError.message }

    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) return { success: false, error: error.message }
    return { success: true, data: null }
  } catch (error) {
    console.error('Unexpected error deleting user:', error)
    return { success: false, error: 'Failed to delete user' }
  }
}

export async function getAllUsers(): Promise<ApiResponse<User[]>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error fetching users:', error)
    return { success: false, error: 'Failed to fetch users' }
  }
}

export async function getAllChefs(): Promise<ApiResponse<User[]>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('chef', 'yes')
      .order('created_at', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error fetching chefs:', error)
    return { success: false, error: 'Failed to fetch chefs' }
  }
}

// ==================== RESUME OPERATIONS ====================

export async function createResume(resumeData: ResumeInsert): Promise<ApiResponse<Resume>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('resumes')
      .insert([resumeData])
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error creating resume:', error)
    return { success: false, error: 'Failed to create resume' }
  }
}

export async function getResumeByUserId(userId: string): Promise<ApiResponse<Resume>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error fetching resume:', error)
    return { success: false, error: 'Failed to fetch resume' }
  }
}

export async function getResumesByUserId(userId: string): Promise<ApiResponse<Resume[]>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error fetching resumes:', error)
    return { success: false, error: 'Failed to fetch resumes' }
  }
}

export async function getResumeByPhone(phone: string): Promise<ApiResponse<Resume>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) return { success: false, error: error.message }
    if (!data) return { success: false, error: 'No resume found for this phone number' }
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error fetching resume by phone:', error)
    return { success: false, error: 'Failed to fetch resume by phone' }
  }
}

export async function updateResume(resumeId: string, updates: ResumeUpdate): Promise<ApiResponse<Resume>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('resumes')
      .update(updates)
      .eq('id', resumeId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error updating resume:', error)
    return { success: false, error: 'Failed to update resume' }
  }
}

export async function getAllResumes(): Promise<ApiResponse<Resume[]>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error fetching resumes:', error)
    return { success: false, error: 'Failed to fetch resumes' }
  }
}

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

export async function getAllResumesPaginated(options: {
  page: number
  limit: number
  search?: string
  experience?: string
  profession?: string
}): Promise<PaginatedResponse<Resume[]>> {
  try {
    const { page, limit, search, experience, profession } = options

    let query = supabaseAdmin
      .from('resumes')
      .select('*')

    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase()
      query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,profession.ilike.%${searchTerm}%,work_type.ilike.%${searchTerm}%`)
    }

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

    if (profession && profession !== 'all') {
      query = query.or(`profession.eq.${profession},work_type.eq.${profession},job_role.eq.${profession}`)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) return { success: false, error: error.message }

    const latestByUser = new Map<string, Resume>()
    for (const resume of data || []) {
      const key = resume.user_id || resume.id
      if (!latestByUser.has(key)) latestByUser.set(key, resume)
    }

    const dedupedResumes = Array.from(latestByUser.values())
    const total = dedupedResumes.length
    const totalPages = Math.ceil(total / limit)
    const safePage = Math.min(Math.max(page, 1), Math.max(totalPages, 1))
    const offset = (safePage - 1) * limit
    const paginatedResumes = dedupedResumes.slice(offset, offset + limit)

    return {
      success: true,
      data: paginatedResumes,
      pagination: {
        page: safePage,
        limit,
        total,
        totalPages,
        hasMore: safePage < totalPages
      }
    }
  } catch (error) {
    console.error('Unexpected error fetching paginated resumes:', error)
    return { success: false, error: 'Failed to fetch resumes' }
  }
}

export async function searchResumes(criteria: {
  location?: string
  profession?: string
  experience?: number
  cuisines?: string[]
}): Promise<ApiResponse<Resume[]>> {
  try {
    let query = supabaseAdmin.from('resumes').select('*')

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
      const cuisineConditions = criteria.cuisines.map(cuisine => `cuisines.ilike.%${cuisine}%`).join(',')
      query = query.or(cuisineConditions)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) return { success: false, error: error.message }
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error searching resumes:', error)
    return { success: false, error: 'Failed to search resumes' }
  }
}

export async function deleteResume(resumeId: string): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabaseAdmin
      .from('resumes')
      .delete()
      .eq('id', resumeId)

    if (error) return { success: false, error: error.message }
    return { success: true, data: null }
  } catch (error) {
    console.error('Unexpected error deleting resume:', error)
    return { success: false, error: 'Failed to delete resume' }
  }
}

// ==================== UTILITY FUNCTIONS ====================

export async function upsertUser(userData: MobileUserData): Promise<ApiResponse<User>> {
  try {
    const existingUser = await getUserByIdentityId(userData.clerk_user_id)

    if (existingUser.success && existingUser.data) {
      const updateData: UserUpdate = {
        name: userData.name,
        photo: userData.photo
      }
      return await updateUser(userData.clerk_user_id, updateData)
    }

    return await createUser(userData)
  } catch (error) {
    console.error('Unexpected error upserting user:', error)
    return { success: false, error: 'Failed to upsert user' }
  }
}

export async function getUserWithResume(identityId: string): Promise<ApiResponse<UserWithResume>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        resumes (*)
      `)
      .eq('clerk_user_id', identityId)
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error fetching user with resume:', error)
    return { success: false, error: 'Failed to fetch user with resume' }
  }
}
