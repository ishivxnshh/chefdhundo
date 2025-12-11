'use client'

import { useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'

export default function LoginToast() {
  const { isSignedIn, isLoaded } = useAuth()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      toast.info('Login to access forms', {
        description: 'You can browse the site, but login is required to submit forms.',
        duration: 3000,
        closeButton: true,
      })
    }
  }, [isSignedIn, isLoaded])

  return null
}
