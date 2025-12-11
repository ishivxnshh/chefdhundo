'use client'

import { useEffect, useState, memo, useCallback } from 'react'
import Link from 'next/link'

const chefTypes = [
  {
    number: "01.",
    title: "Indian Tandoor",
    description: "A skilled culinary role specializing in the operation and mastery of the tandoor oven. This involves preparing a variety of Indian breads (like naan and roti), grilling meats (such as tandoori chicken and kebabs), and ensuring dishes have the authentic smoky flavor characteristic of tandoor cooking. They understand heat control and marination techniques specific to tandoor items."
  },
  {
    number: "02.",
    title: "Indian Commi",
    description: "An entry-level chef in the Indian kitchen, assisting senior chefs with food preparation. This includes chopping vegetables, preparing spice mixes, marinating ingredients, and maintaining a clean and organized work station. They are learning the fundamentals of Indian cuisine and developing their culinary skills under supervision."
  },
  {
    number: "03.",
    title: "Chinese Commi",
    description: "Similar to the Indian Commi, this role is an entry-level position within the Chinese kitchen. Responsibilities involve assisting chefs with prepping ingredients like vegetables, meats, and sauces according to Chinese culinary techniques. They learn about stir-frying, steaming, and other essential Chinese cooking methods while maintaining kitchen hygiene."
  },
  {
    number: "04.",
    title: "Kitchen Helper",
    description: "A support role in the kitchen responsible for basic tasks such as cleaning dishes and kitchen equipment, maintaining sanitation standards, and assisting with food preparation as directed by chefs. They ensure the smooth operation of the kitchen by handling essential but less specialized duties."
  },
  {
    number: "05.",
    title: "Head Chef",
    description: "The culinary leader of the kitchen, responsible for overseeing all food preparation, menu planning, and kitchen staff management. They ensure food quality, consistency, and cost-effectiveness, while also maintaining hygiene standards and often contributing to the restaurant's overall culinary vision."
  }
]

// Memoized card component
const ChefCard = memo(function ChefCard({ 
  chef, 
  showLearnMore = false 
}: { 
  chef: typeof chefTypes[0]
  showLearnMore?: boolean 
}) {
  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100 h-full">
      <div className="text-orange-500 text-3xl font-bold mb-4 md:mb-6">{chef.number}</div>
      <h4 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-gray-800">{chef.title}</h4>
      <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-4 md:mb-6">
        {chef.description}
      </p>
      {showLearnMore && (
        <Link href="#" className="inline-block text-orange-500 hover:text-orange-600 font-medium transition-colors text-base md:text-lg">
          Learn More →
        </Link>
      )}
    </div>
  )
})

function ChefTypesSection() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile and update on resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auto-scroll effect for desktop carousel only
  useEffect(() => {
    if (isMobile) return
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.ceil(chefTypes.length / 3))
    }, 4000)

    return () => clearInterval(interval)
  }, [isMobile])

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(chefTypes.length / 3))
  }, [])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(chefTypes.length / 3)) % Math.ceil(chefTypes.length / 3))
  }, [])

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Our Chef Types</h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Discover the diverse range of culinary professionals we connect with top restaurants and hospitality establishments
          </p>
        </div>
        
        {/* Chef Types - Conditional Rendering */}
        {isMobile ? (
          // Mobile: Simple vertical stack
          <div className="space-y-6">
            {chefTypes.map((chef, index) => (
              <ChefCard key={index} chef={chef} showLearnMore />
            ))}
          </div>
        ) : (
          // Desktop: Carousel
          <div className="relative w-full">
            {/* Carousel Container */}
            <div className="relative overflow-hidden rounded-xl mx-16">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * (100/3)}%)` }}
              >
                {/* First set of cards */}
                {chefTypes.map((chef, index) => (
                  <div key={`first-${index}`} className="w-1/3 flex-shrink-0 px-4">
                    <ChefCard chef={chef} />
                  </div>
                ))}
                {/* Duplicate set for seamless loop */}
                {chefTypes.map((chef, index) => (
                  <div key={`second-${index}`} className="w-1/3 flex-shrink-0 px-4">
                    <ChefCard chef={chef} showLearnMore />
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white p-4 rounded-full shadow-lg hover:shadow-xl transition-shadow border border-gray-200 z-10"
              aria-label="Previous slide"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white p-4 rounded-full shadow-lg hover:shadow-xl transition-shadow border border-gray-200 z-10"
              aria-label="Next slide"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Dots Indicator */}
            <div className="flex justify-center mt-8 space-x-3">
              {Array.from({ length: Math.ceil(chefTypes.length / 3) }, (_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-4 h-4 rounded-full transition-colors ${
                    index === currentSlide ? 'bg-orange-500' : 'bg-gray-300'
                  }`}
                  aria-label={`Go to slide group ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default memo(ChefTypesSection)
