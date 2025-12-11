'use client'

import { SignIn } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Show loading for a brief moment while Clerk initializes
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="w-full max-w-md space-y-8 p-8">
          {/* Logo Skeleton */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
          </div>

          {/* Title Skeleton */}
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded-lg w-3/4 mx-auto animate-pulse" />
            <div className="h-4 bg-gray-200 rounded-lg w-1/2 mx-auto animate-pulse" />
          </div>

          {/* Form Skeletons */}
          <div className="space-y-4 mt-8">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
              <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
              <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
            </div>
            <div className="h-12 bg-gray-300 rounded-lg animate-pulse mt-6" />
          </div>

          {/* Social Login Skeletons */}
          <div className="space-y-3 mt-6">
            <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
          </div>

          {/* Footer Skeleton */}
          <div className="flex justify-center mt-6">
            <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: 'bg-black hover:bg-gray-800 text-sm normal-case',
              card: 'shadow-xl',
              headerTitle: 'text-2xl font-bold',
              headerSubtitle: 'text-gray-600',
              socialButtonsBlockButton: 'border-gray-300 hover:bg-gray-50',
              formFieldInput: 'border-gray-300 focus:border-black focus:ring-black',
              footerActionLink: 'text-black hover:text-gray-700'
            }
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/dashboard"
        />
      </div>
    </div>
  )
}
