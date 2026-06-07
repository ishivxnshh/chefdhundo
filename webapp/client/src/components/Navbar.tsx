"use client"

import React, { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth, SignInButton, UserButton } from '@/lib/auth/client'
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

function AccountMenu({
  label,
  mobile,
  onSignOut,
}: {
  label: string
  mobile?: string | null
  onSignOut: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        title="Account menu"
        aria-label="Open account menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="w-8 h-8 rounded-full bg-gray-900 text-white text-xs font-semibold"
      >
        {label}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-2 text-sm shadow-xl">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="font-medium text-gray-900">Mobile account</p>
            <p className="text-xs text-gray-500">{mobile || 'Signed in'}</p>
          </div>
          <a href="/dashboard" className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50">
            Dashboard
          </a>
          <button
            type="button"
            className="w-full rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50"
            onClick={onSignOut}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

function avatarLabel(name?: string | null) {
  const value = (name || "").trim()
  if (/^\+91\d{10}$/.test(value)) return value.slice(-2)
  return value.slice(0, 2).toUpperCase() || "ME"
}

function AuthRetryButton({ onRetry }: { onRetry: () => void }) {
  return (
    <button
      type="button"
      title="Retry session check"
      aria-label="Retry session check"
      onClick={onRetry}
      className="rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-100"
    >
      Retry
    </button>
  )
}

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isSignedIn, isLoaded: isAuthLoaded, signOut, status: authStatus, reload: reloadAuth } = useAuth()

  // Track if we've ever loaded to prevent flicker on navigation
  const hasEverLoaded = useRef(false)

  // Supabase user store hooks - user is pre-loaded from server via AuthProvider
  const currentUser = useSupabaseCurrentUser()
  const currentUserPhone = currentUser?.clerk_user_id?.startsWith('phone:')
    ? currentUser.clerk_user_id.replace('phone:', '')
    : currentUser?.name?.startsWith('+91')
      ? currentUser.name
      : null
  const isMobileSignedIn = authStatus === 'authenticated' || !!currentUser
  const isLoadingUser = useSupabaseUserLoading()
  const userError = useSupabaseUserError()
  const isUserLoaded = useSupabaseUserLoaded()
  const isAdminUser = useSupabaseIsAdmin()
  const { clearCurrentUser, clearError } = useSupabaseUserStore()

  // Once loaded, remember it to prevent re-showing loading state on navigation
  useEffect(() => {
    if (isAuthLoaded && isUserLoaded) {
      hasEverLoaded.current = true
    }
  }, [isAuthLoaded, isUserLoaded])

  // Clear user state when user signs out
  useEffect(() => {
    if (authStatus === 'unauthenticated' && !currentUser) {
      clearCurrentUser()
      clearError()
      hasEverLoaded.current = false // Reset on sign out
    }
  }, [authStatus, currentUser, clearCurrentUser, clearError])

  // Memoized user badges calculation - stable after first load
  const userBadges = useMemo(() => {
    // If we've loaded before, don't show loading state on navigation
    const showLoadingState = !hasEverLoaded.current && (isLoadingUser || !isAuthLoaded)

    if (!isMobileSignedIn) return []

    if (showLoadingState) {
      return [{ text: 'Loading...', color: 'bg-gray-100 text-gray-600' }]
    }

    if (userError) {
      return [{ text: 'Error', color: 'bg-red-100 text-red-800' }]
    }

    if (!currentUser && isUserLoaded) {
      return [{ text: 'Mobile Account', color: 'bg-blue-100 text-blue-800' }]
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
  }, [isMobileSignedIn, isLoadingUser, userError, currentUser, isUserLoaded, isAuthLoaded])

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev)
  }, [])

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false)
  }, [])

  // Memoized nav links
  const navLinks = useMemo(() => [
    { href: "/", text: "Home", primary: false, prefetch: true, fullReload: false },
    { href: "/findchefs", text: "Find Chef", primary: false, prefetch: true, fullReload: false },
    { href: "/dashboard", text: "Dashboard", primary: false, prefetch: false, fullReload: true },
  ], [])

  const displayLinks = useMemo(() =>
    isAdminUser ? [...navLinks, { href: "/admin", text: "Admin", primary: false, prefetch: false, fullReload: true }] : navLinks
  , [isAdminUser, navLinks])

  const renderAuthControl = (loginClassName: string) => {
    if (!isAuthLoaded) {
      return <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
    }

    if (authStatus === 'error' && !isMobileSignedIn) {
      return <AuthRetryButton onRetry={() => void reloadAuth()} />
    }

    if (isMobileSignedIn) {
      return isSignedIn ? (
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "w-8 h-8"
            }
          }}
        />
      ) : (
        <AccountMenu
          label={avatarLabel(currentUser?.name)}
          mobile={currentUserPhone}
          onSignOut={() => signOut()}
        />
      )
    }

    return (
      <SignInButton mode="modal">
        <button className={loginClassName}>
          Login
        </button>
      </SignInButton>
    )
  }

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
                link.fullReload ? (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-gray-900 hover:text-gray-700 font-medium"
                  >
                    {link.text}
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={link.prefetch}
                    className="text-gray-900 hover:text-gray-700 font-medium"
                  >
                    {link.text}
                  </Link>
                )
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
                {renderAuthControl("bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium")}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-4">
              {/* Auth Button for Mobile - Fixed width */}
              <div className="w-10 h-10 flex items-center justify-center">
                {renderAuthControl("bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm")}
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
                   link.fullReload ? (
                     <a
                       key={link.href}
                       href={link.href}
                       className="block px-3 py-2 text-gray-900 hover:text-gray-700 font-medium"
                       onClick={closeMobileMenu}
                     >
                       {link.text}
                     </a>
                   ) : (
                     <Link
                       key={link.href}
                       href={link.href}
                       prefetch={link.prefetch}
                       className="block px-3 py-2 text-gray-900 hover:text-gray-700 font-medium"
                       onClick={closeMobileMenu}
                     >
                       {link.text}
                     </Link>
                   )
                 ))}
               </div>
             </div>
           )}
        </nav>
      </header>
  )
}

export default memo(Navbar)
