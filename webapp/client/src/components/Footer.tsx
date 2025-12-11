'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

function Footer() {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { href: "/", text: "Home" },
    { href: "/findchefs", text: "Find Chef" },
    { href: "/dashboard", text: "Dashboard" },
    { href: "/contact", text: "Contact Us" },
  ];

  const policyLinks = [
    { href: "/terms", text: "Terms & Conditions" },
    { href: "/refunds", text: "Refunds & Cancellations" },
    { href: "/policy/privacy", text: "Privacy Policy" },
    { href: "/policy/shipping", text: "Shipping Policy" },
  ];

  const socialLinks = [
    { href: "https://www.instagram.com/dheerajsinghbhandari/", icon: "instagram", label: "Instagram" },
    { href: "https://youtube.com/@chefdheerajbhandari?si=qYMFigmSM0vkdiqV", icon: "youtube", label: "YouTube" },
    { href: "https://www.linkedin.com/in/chef-dheeraj-bhandari/", icon: "linkedin", label: "LinkedIn" },
  ];

  const getSocialIcon = (icon: string) => {
    switch (icon) {
      case 'facebook':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        );
      case 'instagram':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2.25" y="2.25" width="19.5" height="19.5" rx="5.25" />
            <path d="M12 8.25a3.75 3.75 0 103.749 3.75A3.744 3.744 0 0012 8.25zm0 6a2.25 2.25 0 112.25-2.25A2.248 2.248 0 0112 14.25z" fill="currentColor" stroke="none" />
            <circle cx="17.25" cy="6.75" r="1.125" fill="currentColor" stroke="none" />
          </svg>
        );
      case 'youtube':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a2.84 2.84 0 00-1.997-2.008C19.287 3.5 12 3.5 12 3.5s-7.287 0-9.501.678A2.84 2.84 0 00.502 6.186 29.63 29.63 0 000 12a29.63 29.63 0 00.502 5.814 2.84 2.84 0 001.997 2.008C4.713 20.5 12 20.5 12 20.5s7.287 0 9.501-.678a2.84 2.84 0 001.997-2.008A29.63 29.63 0 0024 12a29.63 29.63 0 00-.502-5.814zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
          </svg>
        );
      case 'linkedin':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center">
                <Image
                  src="/website/home/logo.png"
                  alt="Chef Dhundo Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="ml-3 text-xl font-bold">Chef Dhundo</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Connect with professional chefs for commercial kitchens, resturants, hotels, and hospitality appartments.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.icon}
                  href={social.href}
                  className="text-gray-400 hover:text-orange-500 transition-colors duration-200"
                  aria-label={social.label}
                >
                  {getSocialIcon(social.icon)}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-orange-500">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-orange-500 transition-colors duration-200 text-sm"
                  >
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>


          {/* Policy Pages */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-orange-500">Policy Pages</h3>
            <ul className="space-y-2">
              {policyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-orange-500 transition-colors duration-200 text-sm"
                  >
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
            
            {/* Contact Info */}
            <div className="pt-4 border-t border-gray-700">
              <h4 className="text-sm font-semibold text-orange-500 mb-2">Contact Info</h4>
              <div className="space-y-1 text-sm text-gray-300">
                <p>📧 contact@ihmgurukul.com</p>
                <p>📞 +91 88261 47981</p>
                <p>📍 New Delhi, India</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-400">
              © {currentYear} Chef Dhundo. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm text-gray-400">
              <Link href="/terms" className="hover:text-orange-500 transition-colors duration-200">
                Terms of Service
              </Link>
              <Link href="/policy/privacy" className="hover:text-orange-500 transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link href="/policy/shipping" className="hover:text-orange-500 transition-colors duration-200">
                Shipping Policy
              </Link>
              <Link href="/refunds" className="hover:text-orange-500 transition-colors duration-200">
                Refund Policy
              </Link>
              <Link href="/contact" className="hover:text-orange-500 transition-colors duration-200">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
