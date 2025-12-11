"use client"

import React, { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth, SignInButton, UserButton } from '@clerk/nextjs'
import { 
  useSupabaseCurrentUser, 
  useSupabaseUserLoading, 
  useSupabaseUserError,
  useSupabaseUserLoaded,
  useSupabaseIsAdmin,
  useSupabaseUserStore
} from '@/store/supabase-store/user-db-store'

// Memoized badge component
const UserBadge = memo(function UserBadge({ text, color }: { text: string; color: string }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${color}`}>
      {text}
    </span>
  )
})

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isSignedIn, isLoaded: isClerkLoaded } = useAuth()
  
  // Track if we've ever loaded to prevent flicker on navigation
  const hasEverLoaded = useRef(false)
  
  // Supabase user store hooks - user is pre-loaded from server via AuthProvider
  const currentUser = useSupabaseCurrentUser()
  const isLoadingUser = useSupabaseUserLoading()
  const userError = useSupabaseUserError()
  const isUserLoaded = useSupabaseUserLoaded()
  const isAdminUser = useSupabaseIsAdmin()
  const { clearCurrentUser, clearError } = useSupabaseUserStore()

  // Once loaded, remember it to prevent re-showing loading state on navigation
  useEffect(() => {
    if (isClerkLoaded && isUserLoaded) {
      hasEverLoaded.current = true
    }
  }, [isClerkLoaded, isUserLoaded])

  // Clear user state when user signs out
  useEffect(() => {
    if (!isSignedIn && isClerkLoaded) {
      clearCurrentUser()
      clearError()
      hasEverLoaded.current = false // Reset on sign out
    }
  }, [isSignedIn, isClerkLoaded, clearCurrentUser, clearError])

  // Memoized user badges calculation - stable after first load
  const userBadges = useMemo(() => {
    // If we've loaded before, don't show loading state on navigation
    const showLoadingState = !hasEverLoaded.current && (isLoadingUser || !isClerkLoaded)
    
    if (!isSignedIn) return []
    
    if (showLoadingState) {
      return [{ text: 'Loading...', color: 'bg-gray-100 text-gray-600' }]
    }
    
    if (userError) {
      return [{ text: 'Error', color: 'bg-red-100 text-red-800' }]
    }
    
    if (!currentUser && isUserLoaded) {
      return [{ text: 'New User ⚪', color: 'bg-blue-100 text-blue-800' }]
    }
    
    if (currentUser) {
      const badges = []
      
      // Role badge (admin has own badge and is pro-equivalent)
      if (currentUser.role === 'admin') {
        badges.push({
          text: 'Admin',
          color: 'bg-black text-white border border-black'
        })
      } else {
        badges.push({
          text: currentUser.role === 'pro' ? 'Pro ⚡' : 'Basic ⚪',
          color: currentUser.role === 'pro' 
            ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
            : 'bg-blue-100 text-blue-800'
        })
      }

      // Chef badge (yes/no only)
      if (currentUser.chef === 'yes') {
        badges.push({
          text: 'Chef 👨‍🍳',
          color: 'bg-green-100 text-green-800 border border-green-300'
        })
      } else {
        badges.push({
          text: 'Owner 🏢',
          color: 'bg-purple-100 text-purple-800 border border-purple-300'
        })
      }
      
      return badges
    }
    
    return []
  }, [isSignedIn, isLoadingUser, userError, currentUser, isUserLoaded, isClerkLoaded])

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev)
  }, [])

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false)
  }, [])

  // Memoized nav links
  const navLinks = useMemo(() => [
    { href: "/", text: "Home", primary: false },
    { href: "/findchefs", text: "Find Chef", primary: false },
    { href: "/dashboard", text: "Dashboard", primary: false },
  ], [])

  const displayLinks = useMemo(() => 
    isAdminUser ? [...navLinks, { href: "/admin", text: "Admin", primary: false }] : navLinks
  , [isAdminUser, navLinks])

  return (
    <header className="bg-white shadow-sm fixed w-full top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
                             <Link href="/" className="flex items-center" onClick={closeMobileMenu}>
                 <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center">
                   <Image
                     src="/website/home/logo.png"
                     alt="Chef Dhundho Logo"
                     width={48}
                     height={48}
                     className="w-full h-full object-cover"
                   />
                 </div>
                 <span className="ml-3 text-xl font-semibold text-gray-900">Chef Dhundho</span>
               </Link>
            </div>
            
            {/* Desktop Menu */}
             <div className="hidden md:flex items-center space-x-8">
              {displayLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-900 hover:text-gray-700 font-medium"
                >
                  {link.text}
                </Link>
              ))}
               
                               {/* User Badges - Role, Chef Status, Loading, etc. */}
                {userBadges.length > 0 && (
                  <div className="flex items-center space-x-2">
                    {userBadges.map((badge, index) => (
                      <UserBadge key={index} text={badge.text} color={badge.color} />
                    ))}
                  </div>
                )}
              
              {/* Auth Button - Fixed width container to prevent layout shift */}
              <div className="ml-4 w-10 h-10 flex items-center justify-center">
                {!isClerkLoaded ? (
                  // Skeleton placeholder while Clerk loads
                  <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                ) : isSignedIn ? (
                  <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8"
                      }
                    }}
                  />
                ) : (
                  <SignInButton mode="modal">
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium">
                      Login
                    </button>
                  </SignInButton>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-4">
              {/* Auth Button for Mobile - Fixed width */}
              <div className="w-10 h-10 flex items-center justify-center">
                {!isClerkLoaded ? (
                  <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                ) : isSignedIn ? (
                  <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8"
                      }
                    }}
                  />
                ) : (
                  <SignInButton mode="modal">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm">
                      Login
                    </button>
                  </SignInButton>
                )}
              </div>
              
              <button
                onClick={toggleMobileMenu}
                className="text-gray-900 hover:text-gray-700 focus:outline-none focus:text-gray-700"
                aria-label="Toggle mobile menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu Overlay */}
           {isMobileMenuOpen && (
             <div className="md:hidden">
               <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
                {displayLinks.map((link) => (
                   <Link
                     key={link.href}
                     href={link.href}
                     className="block px-3 py-2 text-gray-900 hover:text-gray-700 font-medium"
                     onClick={closeMobileMenu}
                   >
                     {link.text}
                   </Link>
                 ))}
               </div>
             </div>
           )}
        </nav>
      </header>
  )
}

export default memo(Navbar)