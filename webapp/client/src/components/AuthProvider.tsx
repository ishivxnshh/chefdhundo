'use client'

import React, { createContext, useContext, useEffect, useRef } from 'react'
import { useUser } from '@/lib/auth/client'
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
 * AuthProvider - Hydrates the Supabase user store with server-fetched user data.
 *
 * Mobile authentication state is owned by MobileAuthProvider. This wrapper
 * keeps the existing Supabase profile store in sync during the migration.
 */
export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const hydrated = useRef(false)
  const fallbackAttempted = useRef(false)
  const store = useSupabaseUserStore()
  const { isSignedIn, isLoaded: authLoaded, user: authUser } = useUser()

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
          lastFetchedIdentityId: initialUser.clerk_user_id
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
      authLoaded &&
      isSignedIn &&
      authUser?.id &&
      !currentUser &&
      !isUserLoaded &&
      !fallbackAttempted.current
    ) {
      fallbackAttempted.current = true

      // Use the store's existing method to fetch/create user
      store.findAndSetCurrentUserByIdentityId(authUser.id).then((foundUser) => {
        const latestError = useSupabaseUserStore.getState().error
        if (!foundUser && authUser && !latestError) {
          store.createUserFromMobileAuthData(authUser)
        }
      })
    }
  }, [authLoaded, isSignedIn, authUser, store])

  return (
    <AuthContext.Provider value={{ user: store.currentUser ?? initialUser, isLoaded: authLoaded }}>
      {children}
    </AuthContext.Provider>
  )
}
