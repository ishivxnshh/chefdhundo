import { create } from 'zustand'
import { User } from '@/types/supabase'

// Request deduplication to prevent multiple simultaneous API calls
const pendingRequests = new Map<string, Promise<unknown>>();

function deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)! as Promise<T>;
  }
  
  const promise = fn().finally(() => {
    pendingRequests.delete(key);
  });
  
  pendingRequests.set(key, promise);
  return promise;
}

// Local storage cache helper
const CACHE_KEY = 'chefdhundo_user_cache'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

interface CachedUser {
  data: User | null
  timestamp: number
}

function getCachedUser(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    const { data, timestamp }: CachedUser = JSON.parse(cached)
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

function setCachedUser(user: User | null) {
  if (typeof window === 'undefined') return
  try {
    const cache: CachedUser = { data: user, timestamp: Date.now() }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore storage errors
  }
}

function clearCachedUser() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch {
    // Ignore storage errors
  }
}

type ClerkEmailAddress = {
  id: string
  emailAddress: string
}

type ClerkUserProfile = {
  id: string
  firstName?: string | null
  lastName?: string | null
  imageUrl?: string | null
  primaryEmailAddressId?: string | null
  emailAddresses?: ClerkEmailAddress[]
}

interface UserSupabaseState {
  // State
  currentUser: User | null
  users: User[]
  isLoading: boolean
  error: string | null
  usersError: string | null
  isUserLoaded: boolean
  lastFetchedClerkId: string | null // Track which clerk ID we last fetched
  
  // Actions
  fetchUserByClerkId: (clerkId: string) => Promise<void>
  fetchAllUsers: () => Promise<void>
  findAndSetCurrentUserByClerkId: (clerkId: string) => Promise<User | null> // New function
  createUserFromClerkData: (clerkUser: ClerkUserProfile) => Promise<void> // Helper to create user from Clerk data
  createUser: (userData: { clerk_user_id: string; name: string; email?: string; photo?: string }) => Promise<void>
  updateUser: (clerkId: string, updates: Partial<User>) => Promise<void>
  updateUserById: (userId: string, updates: Partial<User>) => Promise<void> // Admin function
  updateChefStatus: (userId: string, chef: 'yes' | 'no') => Promise<void> // Admin function
  deleteUser: (userId: string) => Promise<void> // Admin function
  setCurrentUser: (user: User | null) => void
  clearCurrentUser: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const useSupabaseUserStore = create<UserSupabaseState>((set, get) => ({
  // Initial state
  currentUser: null,
  users: [],
  isLoading: false,
  error: null,
  usersError: null,
  isUserLoaded: false,
  lastFetchedClerkId: null,

  // Fetch user by Clerk ID
  fetchUserByClerkId: async (clerkId: string) => {
    return deduplicate(`user-${clerkId}`, async () => {
      // Check cache first
      const cached = getCachedUser()
      if (cached && cached.clerk_user_id === clerkId) {
        set({ currentUser: cached, isLoading: false, isUserLoaded: true, error: null, lastFetchedClerkId: clerkId })
        return
      }
      
      // Prevent multiple concurrent requests for the same user
      const state = get()
      if (state.isLoading || state.lastFetchedClerkId === clerkId) {
        return
      }
    try {
      set({ isLoading: true, error: null, lastFetchedClerkId: clerkId })
      
      const response = await fetch(`/api/user-supabase?clerk_id=${clerkId}`)
      if (!response.ok && response.status === 401) {
        // Don't clear current user if we have one, just update error
        set({ isLoading: false, isUserLoaded: true, error: 'Unauthorized' })
        return
      }
      const result = await response.json()
      
      if (result.success && result.data) {
        setCachedUser(result.data)
        set({ 
          currentUser: result.data, 
          isLoading: false, 
          isUserLoaded: true,
          error: null 
        })
      } else {
        // If API returns no data but success (rare), keep existing if possible or set null
        set({ 
          currentUser: null, 
          isLoading: false, 
          isUserLoaded: true,
          error: null
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      // Keep existing user if we have one, just log error
      const state = get()
      set({ 
        currentUser: state.currentUser, 
        isLoading: false, 
        isUserLoaded: true,
        error: state.currentUser ? null : errorMessage // Only show error if we have no user
      })
    }
    });
  },

  // Find and set current user by comparing Clerk ID with Supabase users
  findAndSetCurrentUserByClerkId: async (clerkId: string) => {
    const state = get()
    
    // Prevent multiple calls for the same clerk ID
    if (state.isLoading || state.lastFetchedClerkId === clerkId) {
      return state.currentUser
    }

    try {
      set({ isLoading: true, error: null, lastFetchedClerkId: clerkId })
      
      const response = await fetch(`/api/user-supabase?clerk_id=${clerkId}`)
      if (!response.ok && response.status === 401) {
        set({ currentUser: null, isLoading: false, isUserLoaded: true, error: 'Unauthorized' })
        return null
      }
      const result = await response.json()
      
      if (result.success && result.data) {
        const foundUser = result.data
        console.log('🔍 User Store: Found user data:', foundUser)
        console.log('🔍 User Store: User ID for resume search:', foundUser.id)
        
        set({ 
          currentUser: foundUser, 
          isLoading: false, 
          isUserLoaded: true,
          error: null 
        })
        
        return foundUser
      } else {
        set({ 
          currentUser: null, 
          isLoading: false, 
          isUserLoaded: true,
          error: null 
        })
        
        return null
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      set({ 
        currentUser: null, 
        isLoading: false, 
        isUserLoaded: true,
        error: errorMessage 
      })
      
      return null
    }
  },

  // Create user from Clerk data if not found in Supabase
  createUserFromClerkData: async (clerkUser: ClerkUserProfile) => {
    try {
      const primaryEmail = clerkUser.emailAddresses?.find((email) => 
        email.id === clerkUser.primaryEmailAddressId
      )?.emailAddress

      const userData = {
        clerk_user_id: clerkUser.id,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Unknown User',
        email: primaryEmail || undefined,
        photo: clerkUser.imageUrl || undefined
      }

      const response = await fetch('/api/user-supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })
      
      if (!response.ok && response.status === 401) {
        set({ error: 'Unauthorized', isLoading: false, isUserLoaded: true })
        return
      }
      const result = await response.json()
      
      if (result.success) {
        set({ 
          currentUser: result.data, 
          isLoading: false, 
          isUserLoaded: true,
          error: null 
        })
      } else {
        set({ 
          error: result.error || 'Failed to create user',
          isLoading: false,
          isUserLoaded: true
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      set({ 
        error: errorMessage,
        isLoading: false,
        isUserLoaded: true
      })
    }
  },

  // Fetch all users
  fetchAllUsers: async () => {
    try {
      set({ isLoading: true, usersError: null })
      const response = await fetch('/api/admin/users', { cache: 'no-store' })
      
      if (!response.ok && response.status === 401) {
        set({ usersError: 'Unauthorized', isLoading: false })
        return
      }
      const result = await response.json()
      if (result.success) {
        set({
          users: result.data || [],
          isLoading: false,
          usersError: null
        })
      } else {
        set({
          users: [],
          isLoading: false,
          usersError: result.error || 'Failed to fetch users'
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      set({ 
        users: [], 
        isLoading: false, 
        usersError: errorMessage 
      })
    }
  },

  // Create user
  createUser: async (userData) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await fetch('/api/user-supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })
      
      if (!response.ok && response.status === 401) {
        set({ error: 'Unauthorized', isLoading: false })
        return
      }
      const result = await response.json()
      
      if (result.success) {
        set({ 
          currentUser: result.data, 
          isLoading: false, 
          error: null 
        })
        
        // Add to users array if it exists
        const currentUsers = get().users
        if (currentUsers.length > 0) {
          set({ users: [result.data, ...currentUsers] })
        }
        

      } else {
        set({ 
          isLoading: false, 
          error: result.error || 'Failed to create user' 
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

  // Update user
  updateUser: async (clerkId: string, updates: Partial<User>) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await fetch('/api/user-supabase', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerk_user_id: clerkId,
          ...updates
        }),
      })
      
      if (!response.ok && response.status === 401) {
        set({ error: 'Unauthorized', isLoading: false })
        return
      }
      const result = await response.json()
      
      if (result.success) {
        set({ 
          currentUser: result.data, 
          isLoading: false, 
          error: null 
        })
        
        // Update in users array if it exists
        const currentUsers = get().users
        if (currentUsers.length > 0) {
          const updatedUsers = currentUsers.map(user => 
            user.clerk_user_id === clerkId ? result.data : user
          )
          set({ users: updatedUsers })
        }
        

      } else {
        set({ 
          isLoading: false, 
          error: result.error || 'Failed to update user' 
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

  // Update user by ID (admin function)
  updateUserById: async (userId: string, updates: Partial<User>) => {
    if (!userId) {
      throw new Error('targetUserId and newRole are required')
    }
    
    try {
      set({ isLoading: true, error: null })
      
      // Extract role from updates for the role endpoint
      const newRole = updates.role
      
      if (!newRole) {
        throw new Error('targetUserId and newRole are required')
      }
      
      // Get current admin user's Clerk ID for verification
      const currentUser = get().currentUser
      const adminClerkId = currentUser?.clerk_user_id || null
      
      const response = await fetch(`/api/admin/users/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId: userId,
          newRole: newRole,
          adminClerkId: adminClerkId
        }),
      })
      
      const result = await response.json()
      
      if (result.success && result.data) {
        set({ isLoading: false, error: null })
        
        // Update in users array
        const currentUsers = get().users
        const updatedUsers = currentUsers.map(user => 
          user.id === userId ? result.data : user
        )
        set({ users: updatedUsers })
      } else {
        set({ 
          isLoading: false, 
          error: result.error || 'Failed to update user' 
        })
        throw new Error(result.error || 'Failed to update user')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      set({ isLoading: false, error: errorMessage })
      throw error
    }
  },

  // Update chef status (admin function)
  updateChefStatus: async (userId: string, chef: 'yes' | 'no') => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await fetch('/api/admin/users/chef-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, chef }),
      })
      
      const result = await response.json()
      
      if (result.success && result.data) {
        set({ isLoading: false, error: null })
        
        // Update in users array
        const currentUsers = get().users
        const updatedUsers = currentUsers.map(user => 
          user.id === userId ? result.data : user
        )
        set({ users: updatedUsers })
      } else {
        set({ 
          isLoading: false, 
          error: result.error || 'Failed to update chef status' 
        })
        throw new Error(result.error || 'Failed to update chef status')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      set({ isLoading: false, error: errorMessage })
      throw error
    }
  },

  // Delete user (admin function)
  deleteUser: async (userId: string) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (result.success) {
        set({ isLoading: false, error: null })
        
        // Remove from users array
        const currentUsers = get().users
        const filteredUsers = currentUsers.filter(user => user.id !== userId)
        set({ users: filteredUsers })
      } else {
        set({ 
          isLoading: false, 
          error: result.error || 'Failed to delete user' 
        })
        throw new Error(result.error || 'Failed to delete user')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      set({ isLoading: false, error: errorMessage })
      throw error
    }
  },

  // Set current user
  setCurrentUser: (user: User | null) => {
    set({ currentUser: user, isUserLoaded: !!user })
  },

  // Clear current user
  clearCurrentUser: () => {
    clearCachedUser()
    set({ 
      currentUser: null, 
      isUserLoaded: false, 
      error: null,
      lastFetchedClerkId: null // Reset the tracking
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
}))

// Selector hooks for easier component usage
export const useSupabaseCurrentUser = () => useSupabaseUserStore(state => state.currentUser)
export const useSupabaseUsers = () => useSupabaseUserStore(state => state.users)
export const useSupabaseUserLoading = () => useSupabaseUserStore(state => state.isLoading)
export const useSupabaseUserError = () => useSupabaseUserStore(state => state.error)
export const useSupabaseUsersError = () => useSupabaseUserStore(state => state.usersError)
export const useSupabaseUserLoaded = () => useSupabaseUserStore(state => state.isUserLoaded)
export const useSupabaseIsAdmin = () => useSupabaseUserStore(state => state.currentUser?.role === 'admin')
