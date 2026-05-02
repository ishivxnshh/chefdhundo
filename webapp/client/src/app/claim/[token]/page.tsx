'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ClaimResponse {
  success: boolean
  message?: string
  error?: string
  data?: {
    id: string
    name: string
    email: string
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

  useEffect(() => {
    if (!isLoaded) return

    if (!token) {
      setClaimStatus('error')
      setMessage('Invalid claim link. No token provided.')
      return
    }

    // Auto-claim only when user is signed in
    if (user) {
      handleClaimResume()
    }
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
        setClaimStatus('success')
        setMessage(`Resume claimed successfully! Welcome, ${data.data?.name || 'Chef'}!`)
        toast.success('Resume claimed successfully!')

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        setClaimStatus('error')
        setMessage(data.error || 'Failed to claim resume')
        toast.error(data.error || 'Failed to claim resume')
      }
    } catch (error) {
      console.error('Error claiming resume:', error)
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
                  Login to claim your resume
                </p>
                <SignInButton mode="modal">
                  <button className="w-full bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors">
                    Login & Claim
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
                    onClick={handleClaimResume}
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
