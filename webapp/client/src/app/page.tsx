import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Server Component imports
import HeroSection from '@/components/home/HeroSection'
import FormsSection from '@/components/home/FormsSection'
import ChefTypesSection from '@/components/home/ChefTypesSection'
import WhyChooseUsSection from '@/components/home/WhyChooseUsSection'
import OutletsSection from '@/components/home/OutletsSection'
import LoginToast from '@/components/home/LoginToast'

// Skeleton components for loading states
function FormsSectionSkeleton() {
  return (
    <section className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <Skeleton className="flex-1 h-64 rounded-2xl" />
          <Skeleton className="flex-1 h-64 rounded-2xl" />
        </div>
      </div>
    </section>
  )
}

function ChefTypesSkeleton() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Skeleton className="h-12 w-64 mx-auto mb-6" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    </section>
  )
}

function WhyChooseUsSkeleton() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Skeleton className="h-12 w-64 mx-auto mb-6" />
        <Skeleton className="h-6 w-full max-w-4xl mx-auto mb-16" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    </section>
  )
}

function OutletsSkeleton() {
  return (
    <section className="py-20 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <Skeleton className="h-10 w-48 mx-auto mb-10 bg-gray-700" />
        <div className="flex space-x-8 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="w-24 h-24 rounded-lg bg-gray-700 flex-shrink-0" />
          ))}
        </div>
      </div>
    </section>
  )
}

// Main page component - Server Component
export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero - Server rendered, priority loading */}
      <HeroSection />
      
      {/* Forms - Client component with Suspense boundary */}
      <Suspense fallback={<FormsSectionSkeleton />}>
        <FormsSection />
      </Suspense>
      
      {/* Chef Types - Client component (carousel) */}
      <Suspense fallback={<ChefTypesSkeleton />}>
        <ChefTypesSection />
      </Suspense>
      
      {/* Why Choose Us - Mostly static, can be server rendered */}
      <Suspense fallback={<WhyChooseUsSkeleton />}>
        <WhyChooseUsSection />
      </Suspense>
      
      {/* Outlets - Client component (marquee) */}
      <Suspense fallback={<OutletsSkeleton />}>
        <OutletsSection />
      </Suspense>
      
      {/* Login Toast - Client only */}
      <LoginToast />
    </div>
  )
}

