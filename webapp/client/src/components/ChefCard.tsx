'use client'

import React, { memo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Resume } from '@/types/supabase'
import { maskEmail, maskPhone } from '@/lib/utils'

interface ChefCardProps {
  resume: Resume
  index: number
  userRole: string
  isClickable: boolean
  onCardClick: (resume: Resume) => void
}

// Memoized Chef Card component to prevent unnecessary re-renders
const ChefCard = memo(function ChefCard({ 
  resume, 
  index, 
  userRole, 
  isClickable,
  onCardClick 
}: ChefCardProps) {
  // Extract data directly from Supabase resume object
  const name = resume.name || 'Name not available'
  const email = resume.email || ''
  const phone = resume.phone || ''
  const location = resume.city || resume.user_location || 'Location not specified'
  const totalExperience = resume.experience_years || 0
  const jobType = resume.work_type || resume.profession || ''

  const handleClick = useCallback(() => {
    if (isClickable) {
      onCardClick(resume)
    }
  }, [isClickable, onCardClick, resume])

  return (
    <motion.div
      key={`${resume.id}-${index}`}
      variants={{
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.5 }}
      whileHover={{
        scale: isClickable ? 1.03 : 1,
        boxShadow: isClickable ? "0px 10px 30px rgba(0, 0, 0, 0.1)" : "none",
      }}
      onClick={handleClick}
    >
      <Card 
        className={`h-full flex flex-col border rounded-lg overflow-hidden ${
          isClickable ? "cursor-pointer hover:shadow-lg transition-all duration-200" : ""
        }`}
      >
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {name}
                </CardTitle>
                {resume.verified === 'resume' && (
                  <div className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-full" title="Verified Chef">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <CardDescription>
                {location}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2">
              {jobType && (
                <Badge variant="secondary" className="capitalize">
                  {jobType}
                </Badge>
              )}
              {totalExperience > 0 && (
                <Badge variant="outline" className="text-xs">
                  {totalExperience} years exp
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="border-t pt-4 mt-4">
            {email && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <strong>Email:</strong>{" "}
                  {maskEmail(email, userRole)}
                </p>
              </div>
            )}
            {phone && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <strong>Phone:</strong>{" "}
                  {maskPhone(phone, userRole)}
                </p>
                {userRole === "basic" && (
                  <a
                    href="/upgrade"
                    className="text-xs text-orange-600 bg-orange-100 hover:bg-orange-200 px-3 py-1 rounded-full font-medium transition-colors duration-200 cursor-pointer"
                  >
                    🔒 Upgrade to Pro
                  </a>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})

export default ChefCard
