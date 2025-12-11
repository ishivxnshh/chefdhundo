'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RefundsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-12 mt-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <Card className="bg-white/80 backdrop-blur border border-orange-100 shadow-lg">
          <CardHeader className="text-center space-y-4">
            <CardTitle className="text-3xl font-bold text-gray-900">Refunds &amp; Cancellations Policy</CardTitle>
            <p className="text-sm font-medium text-gray-500">Last Updated: November 2025</p>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              At ChefDhundo, we are committed to providing transparent and reliable services to hospitality owners and chef
              candidates. This page outlines our updated Refunds &amp; Cancellations policy applicable to all subscription plans
              and recruitment services.
            </p>
          </CardHeader>

          <CardContent className="space-y-10 text-gray-700">
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-orange-600">1. Subscription Usage</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Hospitality owners may select a subscription plan based on their preferred duration.</li>
                <li>Services remain accessible until the plan expires.</li>
                <li>Once candidate profiles are delivered, owners may hire chefs independently — outside the ChefDhundo platform.</li>
                <li><strong>Important:</strong> All plans become non-refundable once candidate profiles are delivered.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-orange-600">2. Refund Eligibility</h2>
              <p>Refunds are only applicable under the following exceptional circumstances:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Candidate profiles/resumes are not delivered after upgrading to a Pro plan.</li>
                <li>Payment is successfully deducted, but a transaction failure or error message is displayed.</li>
                <li>Payment is completed, but the screen remains stuck on a loading message without confirmation.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-orange-600">3. Refund Timelines</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Eligible refunds are processed within 3 to 5 working days.</li>
                <li>In some cases, refunds may be issued immediately to the original payment method.</li>
                <li>Processing time may vary depending on your bank or payment provider.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-orange-600">4. Contact for Refund Queries</h2>
              <ul className="space-y-2">
                <li><strong>Email:</strong> contact@ihmgurukul.com</li>
                <li><strong>Phone:</strong> +91 8826147981</li>
                <li><strong>Address:</strong> New Delhi, India</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-orange-600">5. Policy Updates</h2>
              <p>ChefDhundo reserves the right to update or modify its subscription and refund policies at any time.</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Changes will be reflected on this page with an updated “Last Modified” date.</li>
                <li>We recommend reviewing this policy before renewing or upgrading your subscription.</li>
              </ul>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
