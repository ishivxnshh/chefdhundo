'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@/lib/auth/client'
import { SignedIn, SignedOut, SignInButton } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

// The claim token is stored locally only as a redirect safety net. The server
// still validates that the signed-in mobile number owns the resume phone.
interface ClaimResponse {
  success: boolean
  message?: string
  error?: string
  data?: {
    id: string
    name: string
  }
}

export default function ClaimPage() {
  const params = useParams()
  const token = params?.token as string
  const router = useRouter()
  const { user, isLoaded } = useUser()

  const [isLoading, setIsLoading] = useState(false)
  const [claimStatus, setClaimStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  // Prevent double-firing: once a claim attempt starts, don't start another
  const claimAttempted = useRef(false)

  // Always persist the token to localStorage as soon as the page loads.
  // This is the safety-net: if any redirect happens before the claim
  // completes, the dashboard's pending-claim effect will finish the job.
  useEffect(() => {
    if (token) {
      localStorage.setItem('claim_token', token)
    }
  }, [token])

  // When the user is signed in and mobile authentication has loaded, run the claim.
  useEffect(() => {
    if (!isLoaded) return
    if (!token) {
      setClaimStatus('error')
      setMessage('Invalid claim link. No token provided.')
      return
    }

    // Only attempt the claim when the user is authenticated AND we haven't
    // already started an attempt this mount cycle.
    if (user && !claimAttempted.current) {
      claimAttempted.current = true
      handleClaimResume()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user, token])

  const handleClaimResume = async () => {
    if (!token) {
      setClaimStatus('error')
      setMessage('Invalid token')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/resumes/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data: ClaimResponse = await response.json()

      if (!response.ok) {
        setClaimStatus('error')
        setMessage(data.error || 'Failed to claim resume')
        toast.error(data.error || 'Failed to claim resume')
        return
      }

      if (data.success) {
        // Claim succeeded — remove the localStorage token so the dashboard
        // doesn't attempt a redundant second claim.
        localStorage.removeItem('claim_token')

        setClaimStatus('success')
        setMessage(`Resume claimed successfully! Welcome, ${data.data?.name || 'Chef'}!`)
        toast.success('Resume claimed successfully!')


        // Give the user a moment to see the success state, then navigate.
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      } else {
        setClaimStatus('error')
        setMessage(data.error || 'Failed to claim resume')
        toast.error(data.error || 'Failed to claim resume')
      }
    } catch (error) {
      console.error('[ClaimPage] Error claiming resume:', error)
      setClaimStatus('error')
      setMessage('An unexpected error occurred. Please try again.')
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-orange-50 to-red-50">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    )
  }

  // Build the full URL to redirect back to this exact claim page after auth.
  // Using a relative path works for both localhost and production.
  const claimPageUrl = `/claim/${token}`

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 to-red-50 py-12 flex items-center justify-center mt-16">
      <div className="w-full max-w-md px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Claim Your Resume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <SignedOut>
              <div className="text-center space-y-4">
                <p className="text-gray-600 mb-3">
                  Sign up or log in to claim your resume
                </p>
                {/*
                  IMPORTANT: mode="redirect" (not "modal") so that after
                  mobile authentication completes it redirects back to this
                  same claim page with a fully established server-side
                  session.  The useEffect above will then fire with user
                  set and call handleClaimResume() successfully.
                */}
                <SignInButton
                  mode="redirect"
                  forceRedirectUrl={claimPageUrl}
                >
                  <button className="w-full bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors">
                    Sign Up &amp; Claim
                  </button>
                </SignInButton>
              </div>
            </SignedOut>

            <SignedIn>
              {claimStatus === 'idle' && (
                <div className="text-center space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-orange-600 mx-auto" />
                  <p className="text-gray-600">Processing your claim...</p>
                </div>
              )}

              {claimStatus === 'success' && (
                <div className="text-center space-y-4">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                  <p className="text-gray-900 font-semibold">{message}</p>
                  <p className="text-sm text-gray-600">Redirecting to your dashboard...</p>
                </div>
              )}

              {claimStatus === 'error' && (
                <div className="text-center space-y-4">
                  <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
                  <p className="text-gray-900 font-semibold">{message}</p>
                  <Button
                    onClick={() => {
                      claimAttempted.current = false
                      handleClaimResume()
                    }}
                    disabled={isLoading}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Trying...
                      </>
                    ) : (
                      'Try Again'
                    )}
                  </Button>
                </div>
              )}
            </SignedIn>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
