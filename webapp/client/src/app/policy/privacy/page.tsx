import React from 'react'

export default function PrivacyPolicy() {
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
          <h1 className="text-4xl font-bold text-slate-900 mb-2 text-center tracking-tight">Privacy Policy</h1>
          <p className="text-center text-slate-600 mb-8">Last Updated: November 2025</p>
          
          <div className="prose prose-slate max-w-none text-slate-700 space-y-6 leading-relaxed">
            <p>
              This Privacy Policy explains how <strong>BILLIONAIRE CHEF MEDIA PRIVATE LIMITED</strong> (“Company”, “we”, “our”, or “us”) collects, uses, discloses, and safeguards personal information when you visit or use our website <strong>www.chefdhundo.com</strong> and related services (collectively, the “Platform”).
            </p>
            <p>
              By accessing or using the Platform, you consent to the collection and use of your information in accordance with this Privacy Policy. If you do not agree, please do not use the Platform.
            </p>

            <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">Information we collect</h2>
            <p>We may collect the following categories of information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Candidate information:</strong> Name, contact details (phone number, email address), location, work experience, skills, resume/CV, portfolio links, and other details you provide while creating a profile or submitting your resume.</li>
              <li><strong>Employer information:</strong> Name, business name, contact details, job role, and any other information provided for posting jobs or contacting candidates.</li>
              <li><strong>Account and usage data:</strong> Login credentials (stored in secured form), IP address, device information, browser type, pages visited, time spent on pages, and other analytics data to improve our services.</li>
              <li><strong>Communication data:</strong> Messages, emails, or other communications you send to us or through the Platform (for example, inquiries or feedback).</li>
              <li><strong>Payment-related data:</strong> Limited information related to transactions processed via payment gateways such as Razorpay (e.g., transaction ID, payment status), but not your full card details, which are handled directly by the payment gateway.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">How we use your information</h2>
            <p>We use the collected information for purposes including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Providing and operating the Platform, including connecting candidates with hospitality employers and enabling employers to contact suitable candidates.</li>
              <li>Creating and managing user accounts and profiles for candidates and employers.</li>
              <li>Facilitating communication between candidates and employers where both parties have chosen to connect.</li>
              <li>Processing payments for any paid services or subscriptions through integrated payment gateways (such as Razorpay).</li>
              <li>Improving, personalizing, and expanding our services, including analytics, troubleshooting, and Platform enhancements.</li>
              <li>Responding to your inquiries, providing customer support, and sending important service-related notifications.</li>
              <li>Complying with legal obligations, enforcing our terms and conditions, and protecting the rights, property, and safety of our users and the Platform.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">Sharing of information</h2>
            <p>We may share your information in the following ways:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>With employers:</strong> Candidate profiles, resumes, and relevant details may be shared with verified hospitality employers and outlet owners who use the Platform to hire staff. This is the core purpose of the Platform.</li>
              <li><strong>With candidates:</strong> Certain employer details may be shared with relevant candidates to facilitate the hiring process.</li>
              <li><strong>With service providers:</strong> Third-party service providers (such as hosting providers, analytics tools, and payment gateways like Razorpay) may receive limited information as needed to perform services on our behalf, under appropriate confidentiality and security obligations.</li>
              <li><strong>For legal reasons:</strong> Information may be disclosed when required by law, regulation, legal process, or governmental request, or to protect our rights or the rights and safety of others.</li>
              <li><strong>Business transfers:</strong> In case of a merger, acquisition, sale of assets, or similar transaction, user information may be transferred as part of that transaction, subject to applicable laws.</li>
            </ul>
            <p>We do not sell your personal information to third parties.</p>

            <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">Legal basis (for users in applicable jurisdictions)</h2>
            <p>Where required by law, we process personal information based on:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your consent (for example, when you submit a resume or create a profile).</li>
              <li>Performance of a contract (for example, to provide Platform services you request).</li>
              <li>Legitimate interests (such as improving services, preventing fraud, and enabling efficient hospitality hiring).</li>
              <li>Compliance with legal obligations.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">Data retention</h2>
            <p>We retain personal information for as long as necessary to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fulfil the purposes outlined in this Privacy Policy.</li>
              <li>Provide services to you as a candidate or employer.</li>
              <li>Comply with legal, accounting, or reporting obligations.</li>
            </ul>
            <p>You may request deletion of your account and associated information, subject to our need to retain certain data for legal or legitimate business purposes.</p>

            <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">Data security</h2>
            <p>We implement reasonable technical and organizational measures to protect personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is completely secure, and we cannot guarantee absolute security.</p>

            <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">Your rights and choices</h2>
            <p>Depending on your jurisdiction, you may have rights such as:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Accessing the personal information we hold about you.</li>
              <li>Requesting correction or updating of inaccurate or incomplete information.</li>
              <li>Requesting deletion of your personal information, subject to legal and contractual limitations.</li>
              <li>Objecting to or restricting certain types of processing.</li>
              <li>Withdrawing consent at any time where processing is based on consent, without affecting the lawfulness of processing before withdrawal.</li>
            </ul>
            <p>You can exercise these rights by contacting us using the details provided in the “Contact us” section.</p>

            <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">Cookies and tracking technologies</h2>
            <p>The Platform may use cookies or similar technologies to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Remember your preferences and improve user experience.</li>
              <li>Perform analytics and understand how the Platform is used.</li>
            </ul>
            <p>You can manage cookie settings through your browser, but disabling cookies may affect some features of the Platform.</p>

            <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">Third-party links</h2>
            <p>The Platform may contain links to third-party websites or services that are not operated by us. This Privacy Policy does not apply to those third-party sites, and you are encouraged to review their privacy policies separately.</p>

            <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">Children’s privacy</h2>
            <p>The Platform is not intended for individuals under the age of 18, and we do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us so that we can take appropriate steps.</p>

            <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">Changes to this Privacy Policy</h2>
            <p>We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. The updated version will be indicated by an updated “Effective Date” and will be effective as soon as it is posted on the Platform.</p>

            <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">Contact us</h2>
            <p>If you have any questions, concerns, or requests regarding this Privacy Policy or our handling of personal information, please contact us at:</p>
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



