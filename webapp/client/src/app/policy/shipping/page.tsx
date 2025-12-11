import React from 'react'

export default function ShippingPolicy() {
  return (
    <div className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-cyan-100 via-white to-orange-100 flex items-center justify-center py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Glossy Card */}
      <div className="relative max-w-4xl w-full backdrop-blur-xl bg-white/30 border border-white/60 shadow-2xl rounded-3xl overflow-hidden z-10">
        {/* Gloss Reflection Layer */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/80 to-transparent opacity-50 pointer-events-none" />
        
        {/* Content */}
        <div className="relative z-10 p-8 sm:p-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 text-center tracking-tight">Shipping Policy</h1>
          <p className="text-center text-slate-600 mb-8">Last Updated: November 2025</p>
          
          <div className="prose prose-slate max-w-none text-slate-700 space-y-6 leading-relaxed">
            <p>
              This Shipping Policy applies to the use of <strong>www.chefdhundo.com</strong> and any services offered through the Platform. The Platform connects hospitality talent (candidates) with hospitality employers and outlet owners and does not involve the sale or delivery of any physical or tangible products.
            </p>

            <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">Nature of services</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>ChefDhundo provides talent discovery, staffing, and related digital services in the hospitality and food & beverage sector.</li>
              <li>All services offered are digital or service-based, such as candidate sourcing, profile submissions, and employer access, and are delivered online or through electronic communication.</li>
              <li>No physical goods, equipment, or tangible items are sold, shipped, or delivered by ChefDhundo through the Platform.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">No physical shipping</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Since ChefDhundo does not sell or dispatch any physical products, there is no shipping of items to any address.</li>
              <li>As a result, concepts like shipping charges, delivery timelines, courier partners, and tracking numbers are not applicable to our services.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">Service delivery timelines</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Any paid services (for example, profile promotions, employer access, or other digital offerings, if applicable) are typically activated or delivered digitally within a reasonable time after successful payment confirmation from the payment gateway.</li>
              <li>In case of any delay in activation of a digital service, users may contact our support team for assistance using the details provided on the Contact Us page.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">Address information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Users may be asked to provide location or address information as part of their profile or business details for identification, invoicing, or matching purposes only.</li>
              <li>Such information is not used for shipping or delivery of physical products, as ChefDhundo does not provide any logistics or shipping services.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">International users</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Since ChefDhundo offers only digital and service-based solutions, international shipping is not applicable.</li>
              <li>International users may access the Platform online, subject to our terms and conditions and applicable laws.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">Changes to this Shipping Policy</h2>
            <p>We may update this Shipping Policy from time to time to meet regulatory requirements or reflect changes in our services. The revised version will be effective once posted on the Platform.
            </p>

            <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">Contact us</h2>
            <p>For any questions or clarifications regarding this Shipping Policy or the nature of our services, please contact us at:</p>
            <div className="bg-white/40 p-4 rounded-lg border border-white/50 not-prose">
              <p className="font-medium text-slate-900">Email: <a href="mailto:contact@ihmgurukul.com" className="text-blue-600 hover:underline">contact@ihmgurukul.com</a></p>
              <p className="font-medium text-slate-900">Address: New Delhi, India</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


