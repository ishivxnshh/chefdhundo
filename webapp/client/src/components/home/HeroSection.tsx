import Image from 'next/image'

export default function HeroSection() {
  return (
    <section className="relative text-white min-h-screen flex items-center pt-16">
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.pexels.com/photos/3217157/pexels-photo-3217157.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
          alt="Chef in a modern kitchen"
          fill
          sizes="100vw"
          style={{ objectFit: 'cover' }}
          priority
          className="brightness-75"
        />
        {/* Dark overlay with red gradient */}
        <div className="absolute inset-0 bg-black opacity-50" />
        <div className="absolute inset-0 bg-linear-to-r from-orange-300 to-blue-800 opacity-10" />
      </div>
      <div className="absolute inset-0 bg-black opacity-60"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-4xl">
          <p className="text-lg mb-4 text-gray-200">Your Premier Partner in Culinary Staffing</p>
          <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Get Hired Faster – Chef Jobs Made Easy
          </h1>
          <p className="text-xl mb-8 text-gray-200 leading-relaxed">
            Create your profile, showcase your skills, and get hired by top clients and restaurants – fast and easy
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="#get-a-job" className="bg-orange-500 text-white px-8 py-4 rounded-md hover:bg-orange-600 transition-colors font-medium text-center">
              Get a Job
            </a>
            <a href="#hire-a-chef" className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-md hover:bg-white hover:text-gray-900 transition-colors font-medium text-center">
              Contact a Chef
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
