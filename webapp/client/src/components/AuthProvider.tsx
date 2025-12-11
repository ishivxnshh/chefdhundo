'use client'

import React, { createContext, useContext, useEffect, useRef } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { useSupabaseUserStore } from '@/store/supabase-store/user-db-store'
import type { User } from '@/types/supabase'

interface AuthContextType {
  user: User | null
  isLoaded: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoaded: false
})

export function useAuthContext() {
  return useContext(AuthContext)
}

interface AuthProviderProps {
  children: React.ReactNode
  initialUser: User | null
}

/**
 * AuthProvider - Hydrates Zustand store with server-fetched user data
 * 
 * This eliminates the client-side loading delay by:
 * 1. Receiving pre-fetched user data from the server layout
 * 2. Immediately hydrating the Zustand store on mount
 * 3. Falling back to client-side fetch if server data is missing
 */
export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const hydrated = useRef(false)
  const fallbackAttempted = useRef(false)
  const store = useSupabaseUserStore()
  const { isSignedIn, isLoaded: clerkLoaded } = useAuth()
  const { user: clerkUser } = useUser()
  
  // Hydrate the store with server data on mount - only once
  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true
      
      if (initialUser) {
        // Server provided user data - use it immediately
        store.setCurrentUser(initialUser)
        store.setLoading(false)
        useSupabaseUserStore.setState({ 
          isUserLoaded: true,
          lastFetchedClerkId: initialUser.clerk_user_id 
        })
      } else {
        // No server data - mark as needing fallback fetch
        store.setLoading(false)
        useSupabaseUserStore.setState({ isUserLoaded: false })
      }
    }
  }, [initialUser, store])
  
  // Fallback: If signed in but no user data, fetch client-side
  useEffect(() => {
    const currentUser = store.currentUser
    const isUserLoaded = useSupabaseUserStore.getState().isUserLoaded
    
    if (
      clerkLoaded && 
      isSignedIn && 
      clerkUser?.id && 
      !currentUser && 
      !isUserLoaded &&
      !fallbackAttempted.current
    ) {
      fallbackAttempted.current = true
      console.log('AuthProvider: Server did not provide user, fetching client-side...')
      
      // Use the store's existing method to fetch/create user
      store.findAndSetCurrentUserByClerkId(clerkUser.id).then((foundUser) => {
        if (!foundUser && clerkUser) {
          store.createUserFromClerkData(clerkUser)
        }
      })
    }
  }, [clerkLoaded, isSignedIn, clerkUser, store])
  
  return (
    <AuthContext.Provider value={{ user: initialUser, isLoaded: true }}>
      {children}
    </AuthContext.Provider>
  )
}
