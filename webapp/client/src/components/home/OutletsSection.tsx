import Image from 'next/image'
import { memo } from 'react'

// Memoized outlet image component with lazy loading
const OutletImage = memo(function OutletImage({ index }: { index: number }) {
  return (
    <div className="flex-shrink-0">
      <div className="bg-white/90 p-3 rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden border border-white/30">
        <Image
          src={`/website/outlets/${index + 1}.png`}
          alt={`Outlet ${index + 1}`}
          width={120}
          height={120}
          loading="lazy"
          className="w-24 h-24 object-cover rounded-lg"
        />
      </div>
    </div>
  )
})

function OutletsSection() {
  return (
    <section className="py-20 bg-gray-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 opacity-20"></div>
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500 rounded-full opacity-10 transform translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-500 rounded-full opacity-10 transform -translate-x-32 translate-y-32"></div>
      </div>
      <div className="relative w-full px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-10">
          <h2 className="text-3xl font-bold text-white">Our Outlets</h2>
          <div className="relative w-full overflow-hidden">
            <div className="flex animate-marquee space-x-8">
              {Array.from({ length: 20 }, (_, index) => (
                <OutletImage key={`first-${index}`} index={index} />
              ))}
              {Array.from({ length: 20 }, (_, index) => (
                <OutletImage key={`second-${index}`} index={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default memo(OutletsSection)
