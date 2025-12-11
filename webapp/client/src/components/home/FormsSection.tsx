'use client'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { motion } from 'framer-motion'
import { useAuth, SignInButton } from '@clerk/nextjs'
import { SubmitResume } from '@/components/submitResume'
import { memo } from 'react'

// Memoized motion card for better performance
const MotionCard = memo(function MotionCard({ 
  children, 
  id, 
  delay = 0 
}: { 
  children: React.ReactNode
  id: string
  delay?: number 
}) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut', delay }}
      className="flex-1"
      viewport={{ once: true }}
    >
      {children}
    </motion.div>
  )
})

function FormsSection() {
  const { isSignedIn, isLoaded } = useAuth()

  return (
    <section className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Submit Resume Form */}
          {isLoaded && isSignedIn ? (
            <SubmitResume />
          ) : (
            <MotionCard id="get-a-job">
              <Card className="p-8 rounded-2xl shadow-xl border-0 bg-linear-to-br from-orange-50 to-white">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-4 text-gray-900">Submit Resume: Get a Job 👩‍🍳</h2>
                  <p className="text-gray-600 mb-6">
                    Please sign in to access the resume submission form.
                  </p>
                  <SignInButton mode="modal">
                    <button className="bg-orange-500 text-white px-6 py-3 rounded-md hover:bg-orange-600 transition-colors font-medium">
                      Sign In to Submit Resume
                    </button>
                  </SignInButton>
                </div>
              </Card>
            </MotionCard>
          )}
          
          {/* Vertical Divider for desktop only */}
          <div className="hidden md:flex h-auto self-stretch items-center">
            <div className="w-px bg-gray-200 h-full mx-2" />
          </div>
          
          {/* Find Chef Search Form */}
          <MotionCard id="hire-a-chef" delay={0.1}>
            <Card className="p-8 rounded-2xl shadow-xl border-0 bg-linear-to-br from-blue-50 to-white flex flex-col justify-between h-full">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Hire a Chef 🤝</h2>
              <form className="space-y-5 flex flex-col h-full justify-between" onSubmit={e => {
                e.preventDefault();
                const search = (e.currentTarget.elements.namedItem('findchef-search') as HTMLInputElement).value;
                if (search) {
                  window.location.href = `/findchefs?search=${encodeURIComponent(search)}`;
                } else {
                  window.location.href = '/findchefs';
                }
              }}>
                <div className="space-y-2 flex-1">
                  <Label htmlFor="findchef-search">Search Chefs / खोज करें </Label>
                  <Input
                    type="text"
                    name="findchef-search"
                    id="findchef-search"
                    placeholder="Search by name, location, or experience..."
                    className="p-3"
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md text-lg transition-colors shadow-md mt-4">
                  Search Chefs / खोज करें
                </Button>
              </form>
            </Card>
          </MotionCard>
        </div>
      </div>
    </section>
  )
}

export default memo(FormsSection)
