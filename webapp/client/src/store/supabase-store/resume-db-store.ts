import { create } from 'zustand'
import { Resume } from '@/types/supabase'

// Local storage cache for resumes
const RESUMES_CACHE_KEY = 'chefdhundo_resumes_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface CachedResumes {
  data: Resume[]
  timestamp: number
  pagination?: PaginationInfo
  filters?: FilterState
  isFullList?: boolean
}

// Pagination info from server
interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

// Filter state for caching
interface FilterState {
  search: string
  experience: string
  profession: string
}

function getCachedResumes(filters?: FilterState, requireFullList: boolean = false): { data: Resume[], pagination?: PaginationInfo } | null {
  if (typeof window === 'undefined') return null
  try {
    const cached = localStorage.getItem(RESUMES_CACHE_KEY)
    if (!cached) return null
    const parsed: CachedResumes = JSON.parse(cached)
    
    // Check if cache is expired
    if (Date.now() - parsed.timestamp > CACHE_DURATION) {
      localStorage.removeItem(RESUMES_CACHE_KEY)
      return null
    }

    // If we require the full list (for admin dashboard), but the cache is paginated/filtered, ignore it
    if (requireFullList && !parsed.isFullList) {
      return null
    }
    
    // If filters are provided, they MUST match exactly
    if (filters) {
      // If there's an active search, don't use cache (always fetch fresh)
      if (filters.search && filters.search.trim() !== '') {
        return null
      }
      
      // If cached filters don't exist or don't match, invalidate
      if (!parsed.filters) {
        return null
      }
      
      if (
        filters.search !== parsed.filters.search ||
        filters.experience !== parsed.filters.experience ||
        filters.profession !== parsed.filters.profession
      ) {
        return null // Filters don't match, cache invalid
      }
    }
    
    return { data: parsed.data, pagination: parsed.pagination }
  } catch {
    return null
  }
}

function setCachedResumes(resumes: Resume[], pagination?: PaginationInfo, filters?: FilterState, isFullList: boolean = false) {
  if (typeof window === 'undefined') return
  try {
    const cache: CachedResumes = { 
      data: resumes, 
      timestamp: Date.now(),
      pagination,
      filters,
      isFullList
    }
    localStorage.setItem(RESUMES_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore storage errors
  }
}

function clearCachedResumes() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(RESUMES_CACHE_KEY)
  } catch {
    // Ignore storage errors
  }
}

interface ResumeSupabaseState {
  // State
  resumes: Resume[]
  currentResume: Resume | null
  isLoading: boolean
  error: string | null
  isResumeLoaded: boolean
  
  // Pagination state
  pagination: PaginationInfo | null
  currentFilters: FilterState
  uniqueProfessions: string[]
  
  // Actions
  fetchAllResumes: () => Promise<void>
  fetchResumesPaginated: (options: {
    page: number
    limit?: number
    search?: string
    experience?: string
    profession?: string
  }) => Promise<void>
  fetchResumesByUserId: (userId: string) => Promise<void>
  createResume: (resumeData: Omit<Resume, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateResume: (resumeId: string, updates: Partial<Resume>) => Promise<void>
  deleteResume: (resumeId: string) => Promise<void>
  searchResumes: (criteria: {
    location?: string
    profession?: string
    experience?: number
    cuisines?: string[]
  }) => Promise<void>
  setCurrentResume: (resume: Resume | null) => void
  clearCurrentResume: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  clearResumes: () => void
  setFilters: (filters: Partial<FilterState>) => void
}

export const useSupabaseResumeStore = create<ResumeSupabaseState>((set, get) => ({
  // Initial state
  resumes: [],
  currentResume: null,
  isLoading: false,
  error: null,
  isResumeLoaded: false,
  
  // Pagination state
  pagination: null,
  currentFilters: { search: '', experience: 'all', profession: 'all' },
  uniqueProfessions: [],

  // Fetch all resumes (legacy - fetches everything)
  fetchAllResumes: async () => {
    // Check cache first - REQUIRE full list
    const cached = getCachedResumes(undefined, true)
    if (cached && cached.data.length > 0) {
      set({ 
        resumes: cached.data, 
        isLoading: false, 
        isResumeLoaded: true, 
        error: null,
        pagination: cached.pagination || null 
      })
      return
    }
    
    try {
      set({ isLoading: true, error: null })
      console.log('🔍 Supabase Resume Store: Fetching all resumes...')
      
      const response = await fetch('/api/resumes')
      if (!response.ok && response.status === 401) {
        set({ resumes: [], isLoading: false, isResumeLoaded: true, error: 'Unauthorized' })
        return
      }
      const result = await response.json()
      
      if (result.success && result.data) {
        console.log('✅ Supabase Resume Store: Resumes fetched successfully:', result.data.length)
        
        // Extract unique professions for filter dropdown
        const professions = new Set<string>()
        result.data.forEach((resume: Resume) => {
          if (resume.profession) professions.add(resume.profession)
          if (resume.work_type) professions.add(resume.work_type)
          if (resume.job_role) professions.add(resume.job_role)
        })
        
        // Cache as FULL list
        setCachedResumes(result.data, undefined, undefined, true)
        set({ 
          resumes: result.data, 
          isLoading: false, 
          isResumeLoaded: true,
          error: null,
          uniqueProfessions: Array.from(professions).sort()
        })
      } else {
        console.error('❌ Supabase Resume Store: API returned error:', result.error)
        set({ 
          resumes: [], 
          isLoading: false, 
          isResumeLoaded: true,
          error: result.error || 'Failed to fetch resumes'
        })
      }
    } catch (error) {
      console.error('❌ Supabase Resume Store: Network error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      set({ 
        resumes: [],
        isLoading: false, 
        isResumeLoaded: true,
        error: errorMessage 
      })
    }
  },

  // NEW: Fetch resumes with server-side pagination
  fetchResumesPaginated: async (options) => {
    const { page, limit = 12, search = '', experience = 'all', profession = 'all' } = options
    const filters: FilterState = { search, experience, profession }
    
    // Check cache for same filters and page 1
    if (page === 1) {
      const cached = getCachedResumes(filters)
      if (cached && cached.data.length > 0) {
        set({ 
          resumes: cached.data, 
          isLoading: false, 
          isResumeLoaded: true, 
          error: null,
          pagination: cached.pagination || null,
          currentFilters: filters
        })
        return
      }
    }
    
    try {
      set({ isLoading: true, error: null, currentFilters: filters })
      console.log('🔍 Supabase Resume Store: Fetching paginated resumes...', { page, limit, search, experience, profession })
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        experience,
        profession
      })
      
      const response = await fetch(`/api/resumes?${params.toString()}`)
      if (!response.ok && response.status === 401) {
        set({ resumes: [], isLoading: false, isResumeLoaded: true, error: 'Unauthorized' })
        return
      }
      const result = await response.json()
      
      if (result.success && result.data) {
        console.log('✅ Supabase Resume Store: Paginated resumes fetched:', {
          count: result.data.length,
          pagination: result.pagination
        })
        
        // Cache page 1 results with filters - NOT a full list
        if (page === 1) {
          setCachedResumes(result.data, result.pagination, filters, false)
        }
        
        set({ 
          resumes: result.data, 
          isLoading: false, 
          isResumeLoaded: true,
          error: null,
          pagination: result.pagination || null
        })
      } else {
        console.error('❌ Supabase Resume Store: API returned error:', result.error)
        set({ 
          resumes: [], 
          isLoading: false, 
          isResumeLoaded: true,
          error: result.error || 'Failed to fetch resumes'
        })
      }
    } catch (error) {
      console.error('❌ Supabase Resume Store: Network error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      set({ 
        resumes: [],
        isLoading: false, 
        isResumeLoaded: true,
        error: errorMessage 
      })
    }
  },

  // Set filters (for controlled filter state)
  setFilters: (filters: Partial<FilterState>) => {
    set((state) => ({
      currentFilters: { ...state.currentFilters, ...filters }
    }))
  },

  // Fetch resumes by user ID
  fetchResumesByUserId: async (userId: string) => {
    // Prevent duplicate calls if already loading
    const state = get()
    if (state.isLoading) {
      console.log('🚫 Resume Store: Already loading, skipping duplicate call')
      return
    }
    
    try {
      set({ isLoading: true, error: null })
      console.log('🔍 Resume Store: Fetching resumes for user:', userId)
      
      const response = await fetch(`/api/resumes?user_id=${userId}`)
      if (!response.ok && response.status === 401) {
        set({ resumes: [], isLoading: false, isResumeLoaded: true, error: 'Unauthorized' })
        return
      }
      const result = await response.json()
      
      if (result.success && result.data) {
        set({ 
          resumes: result.data, 
          isLoading: false, 
          isResumeLoaded: true,
          error: null 
        })
      } else {
        set({ 
          resumes: [], 
          isLoading: false, 
          isResumeLoaded: true,
          error: result.error || 'Failed to fetch user resumes' 
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      set({ 
        resumes: [],
        isLoading: false, 
        isResumeLoaded: true,
        error: errorMessage 
      })
    }
  },

  // Create resume
  createResume: async (resumeData) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await fetch('/api/resumes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resumeData),
      })
      
      if (!response.ok && response.status === 401) {
        set({ isLoading: false, error: 'Unauthorized' })
        return
      }
      const result = await response.json()
      
      if (result.success) {
        set({ 
          currentResume: result.data, 
          isLoading: false, 
          error: null 
        })
        
        // Add to resumes array and clear cache
        const currentResumes = get().resumes
        set({ resumes: [result.data, ...currentResumes] })
        clearCachedResumes()
      } else {
        set({ 
          isLoading: false, 
          error: result.error || 'Failed to create resume' 
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      set({ 
        isLoading: false, 
        error: errorMessage 
      })
    }
  },

  // Update resume
  updateResume: async (resumeId: string, updates: Partial<Resume>) => {
    try {
      set({ isLoading: true, error: null })
      
      console.log('🔄 Store: Sending update request for resume:', resumeId, 'with updates:', updates)
      
      const response = await fetch(`/api/resumes/${resumeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      
      console.log('🔄 Store: API response status:', response.status)
      if (!response.ok && response.status === 401) {
        set({ isLoading: false, error: 'Unauthorized' })
        return
      }
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Store: API response not ok:', response.status, errorText)
        throw new Error(`API Error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log('🔄 Store: API response result:', result)
      
      if (result.success) {
        console.log('✅ Store: Resume update successful, updating local state')
        set({ 
          currentResume: result.data, 
          isLoading: false, 
          error: null 
        })
        
        // Update in resumes array and clear cache
        const currentResumes = get().resumes
        const updatedResumes = currentResumes.map(resume => 
          resume.id === resumeId ? result.data : resume
        )
        set({ resumes: updatedResumes })
        clearCachedResumes()
      } else {
        console.error('❌ Store: API returned error:', result.error)
        set({ 
          isLoading: false, 
          error: result.error || 'Failed to update resume' 
        })
        throw new Error(result.error || 'Failed to update resume')
      }
    } catch (error) {
      console.error('❌ Store: Error in updateResume:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      set({ 
        isLoading: false, 
        error: errorMessage 
      })
      throw error // Re-throw so the component can handle it
    }
  },

  // Delete resume
  deleteResume: async (resumeId: string) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await fetch(`/api/resumes/${resumeId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok && response.status === 401) {
        set({ isLoading: false, error: 'Unauthorized' })
        return
      }
      const result = await response.json()
      
      if (result.success) {
        set({ 
          isLoading: false, 
          error: null 
        })
        
        // Remove from resumes array and clear cache
        const currentResumes = get().resumes
        const filteredResumes = currentResumes.filter(resume => resume.id !== resumeId)
        set({ resumes: filteredResumes })
        clearCachedResumes()
        
        // Clear current resume if it was deleted
        const currentResume = get().currentResume
        if (currentResume && currentResume.id === resumeId) {
          set({ currentResume: null })
        }
      } else {
        set({ 
          isLoading: false, 
          error: result.error || 'Failed to delete resume' 
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      set({ 
        isLoading: false, 
        error: errorMessage 
      })
    }
  },

  // Search resumes
  searchResumes: async (criteria) => {
    try {
      set({ isLoading: true, error: null })
      
      const queryParams = new URLSearchParams()
      if (criteria.location) queryParams.append('location', criteria.location)
      if (criteria.profession) queryParams.append('profession', criteria.profession)
      if (criteria.experience !== undefined) queryParams.append('experience', criteria.experience.toString())
      if (criteria.cuisines && criteria.cuisines.length > 0) {
        queryParams.append('cuisines', criteria.cuisines.join(','))
      }
      
      const response = await fetch(`/api/resumes/search?${queryParams.toString()}`)
      if (!response.ok && response.status === 401) {
        set({ resumes: [], isLoading: false, isResumeLoaded: true, error: 'Unauthorized' })
        return
      }
      const result = await response.json()
      
      if (result.success && result.data) {
        set({ 
          resumes: result.data, 
          isLoading: false, 
          isResumeLoaded: true,
          error: null 
        })
      } else {
        set({ 
          resumes: [], 
          isLoading: false, 
          isResumeLoaded: true,
          error: result.error || 'Failed to search resumes' 
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      set({ 
        resumes: [],
        isLoading: false, 
        isResumeLoaded: true,
        error: errorMessage 
      })
    }
  },

  // Set current resume
  setCurrentResume: (resume: Resume | null) => {
    set({ currentResume: resume })
  },

  // Clear current resume
  clearCurrentResume: () => {
    set({ 
      currentResume: null, 
      error: null
    })
  },

  // Set loading state
  setLoading: (loading: boolean) => {
    set({ isLoading: loading })
  },

  // Set error
  setError: (error: string | null) => {
    set({ error })
  },

  // Clear error
  clearError: () => {
    set({ error: null })
  },

  // Clear resumes
  clearResumes: () => {
    clearCachedResumes()
    set({ 
      resumes: [],
      currentResume: null, 
      isResumeLoaded: false, 
      error: null
    })
  },
}))

// Selector hooks for easier component usage
export const useSupabaseResumes = () => useSupabaseResumeStore(state => state.resumes)
export const useSupabaseCurrentResume = () => useSupabaseResumeStore(state => state.currentResume)
export const useSupabaseResumeLoading = () => useSupabaseResumeStore(state => state.isLoading)
export const useSupabaseResumeError = () => useSupabaseResumeStore(state => state.error)
export const useSupabaseResumeLoaded = () => useSupabaseResumeStore(state => state.isResumeLoaded)

// New pagination selectors
export const useSupabaseResumePagination = () => useSupabaseResumeStore(state => state.pagination)
export const useSupabaseResumeFilters = () => useSupabaseResumeStore(state => state.currentFilters)
export const useSupabaseUniqueProfessions = () => useSupabaseResumeStore(state => state.uniqueProfessions)