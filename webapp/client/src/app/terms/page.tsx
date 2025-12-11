'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-12 mt-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <Card className="bg-white/85 backdrop-blur border border-orange-100 shadow-lg">
          <CardHeader className="text-center space-y-4">
            <CardTitle className="text-3xl font-bold text-gray-900">Terms &amp; Conditions – ChefDhundo.com</CardTitle>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Welcome to ChefDhundo.com. By accessing or using our platform, you agree to comply with and be bound by the following
              terms and conditions. These terms govern the relationship between ChefDhundo, chefs, and hospitality owners or HR
              managers using our services.
            </p>
          </CardHeader>

          <CardContent className="space-y-10 text-gray-700">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-orange-600">For Chefs</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Chefs must enter genuine and accurate information in their resumes and profiles. Any false or misleading details may result in removal from the platform.</li>
                <li>Chefs agree to share their resumes and contact details with potential employers and hospitality owners registered on ChefDhundo.</li>
                <li>Chefs permit ChefDhundo to store their information for the purpose of matching them with various types of vacancies.</li>
                <li>Hospitality candidates and staff are free to submit feedback or complaints against any hospitality owner. ChefDhundo will investigate and take appropriate legal action if necessary.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-orange-600">For Hospitality Owners / HR Managers</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Hospitality owners must provide authentic vacancy information along with complete outlet details.</li>
                <li>Owners may update vacancy information at any time and have the right to contact candidates once they upgrade from the basic to the pro version by subscribing to the relevant plan.</li>
                <li>Hospitality owners are free to submit feedback or complaints against any candidate. ChefDhundo will investigate and take appropriate action.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-orange-600">General Terms</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>ChefDhundo is not responsible for any mishiring, incorrect contacts, or misrepresentation by chefs or hospitality staff. All information is user-submitted, and ChefDhundo does not verify every detail.</li>
                <li>ChefDhundo may source resumes from various channels. Hospitality owners may receive additional resumes from ChefDhundo to facilitate faster and easier hiring.</li>
                <li>ChefDhundo caters to a wide range of hospitality owners, including:
                  <ul className="list-disc list-inside pl-6 space-y-1">
                    <li>Cloud kitchen owners</li>
                    <li>Food truck owners</li>
                    <li>Hotel owners</li>
                    <li>HR managers</li>
                    <li>QSR owners</li>
                    <li>Juice shop owners</li>
                    <li>Commercial kitchen operators</li>
                    <li>Catering service providers</li>
                    <li>Restaurant owners</li>
                  </ul>
                </li>
                <li>ChefDhundo is not liable for any malpractice, violation of safety rules, or misconduct by hospitality candidates.</li>
                <li>ChefDhundo does not charge chefs or hospitality candidates any amount to submit their resumes or profiles on ChefDhundo.com. It is completely free for hospitality candidates to submit their details and indicate that they are actively seeking a job.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-orange-600">Governing Law</h2>
              <p>These terms and conditions shall be governed by and construed in accordance with the laws of the Government of Delhi, India.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-orange-600">Contact Information</h2>
              <ul className="space-y-2">
                <li><strong>Email:</strong> contact@ihmgurukul.com</li>
                <li><strong>Phone:</strong> +91 8826147981</li>
                <li><strong>Address:</strong> New Delhi, India</li>
              </ul>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
