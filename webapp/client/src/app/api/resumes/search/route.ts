import { NextRequest, NextResponse } from 'next/server'
import { searchResumes } from '@/lib/supabase/database'

type ResumeSearchCriteria = Parameters<typeof searchResumes>[0]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    const profession = searchParams.get('profession')
    const experience = searchParams.get('experience')
    const cuisines = searchParams.get('cuisines')

    const criteria: ResumeSearchCriteria = {}
    
    if (location) criteria.location = location
    if (profession) criteria.profession = profession
    if (experience) {
      const parsedExperience = Number.parseInt(experience, 10)
      if (!Number.isNaN(parsedExperience)) {
        criteria.experience = parsedExperience
      }
    }

    if (cuisines) {
      const parsedCuisines = cuisines
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)

      if (parsedCuisines.length > 0) {
        criteria.cuisines = parsedCuisines
      }
    }

    const result = await searchResumes(criteria)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        message: `Found ${result.data?.length || 0} matching resumes`
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Search API Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}