import { memo } from 'react'

const stats = [
  { number: "190+", label: "Projects" },
  { number: "180+", label: "Restaurants Opened" },
  { number: "1000+", label: "Trained Hospitality Staffs" },
  { number: "7000+", label: "Hospitality Students Trained" }
]

const features = [
  {
    emoji: "👥",
    title: "India's Largest Hospitality Network",
    description: "Dominant Reach: Covers the most locations, offering maximum convenience. Wide Choice: Provides a diverse range of hospitality options for all needs."
  },
  {
    emoji: "🔍",
    title: "India's Largest Hospitality Manpower Solution",
    description: "Vast Talent Pool: Quick access to the biggest selection of hospitality staff. Specialized Staffing: Understands unique industry hiring needs."
  },
  {
    emoji: "🎓",
    title: "India's Largest Hospitality Edtech With 4300 Hospitality Videos On Chef Dheeraj Bhandari Youtube Channel",
    description: "Unparalleled collection of hospitality video content. Expert-Led Education"
  }
]

// Memoized feature card
const FeatureCard = memo(function FeatureCard({ feature }: { feature: typeof features[0] }) {
  return (
    <div className="bg-gray-100 p-8 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 hover:bg-gradient-to-br hover:from-orange-500 hover:to-red-500 hover:text-white group">
      <div className="text-5xl mb-6 group-hover:text-white">{feature.emoji}</div>
      <h3 className="text-xl font-bold mb-4 text-gray-800 group-hover:text-white">{feature.title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed group-hover:text-white">
        {feature.description}
      </p>
    </div>
  )
})

// Memoized stat card
const StatCard = memo(function StatCard({ stat }: { stat: typeof stats[0] }) {
  return (
    <div className="text-center">
      <div className="text-5xl font-bold text-gray-900 mb-3">{stat.number}</div>
      <div className="text-gray-600 font-medium">{stat.label}</div>
    </div>
  )
})

function WhyChooseUsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Why Choose Us</h2>
        <p className="text-gray-600 mb-16 max-w-4xl mx-auto text-lg leading-relaxed">
          4300+ videos published in 4 years with addressing thousands of chefs pan India and globally to make them capable of run any food and beverage business profitably
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} />
          ))}
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <StatCard key={index} stat={stat} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default memo(WhyChooseUsSection)
