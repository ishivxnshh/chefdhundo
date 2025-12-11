'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Here you would typically send the form data to your backend
      console.log('Contact form submitted:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Thank you for your message! We will get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 to-red-50 py-12 mt-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get in touch with us for any questions, support, or feedback. We&apos;re here to help!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-orange-600">Get in Touch</CardTitle>
                <CardDescription>
                  We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Email</p>
                    <p className="text-gray-600">contact@ihmgurukul.com</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Phone</p>
                    <p className="text-gray-600">+91 8826147981</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Address</p>
                    <p className="text-gray-600">New Delhi, India</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-orange-600">Business Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monday - Friday</span>
                    <span className="font-semibold">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saturday</span>
                    <span className="font-semibold">10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sunday</span>
                    <span className="font-semibold">Closed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-orange-600">Send us a Message</CardTitle>
              <CardDescription>
                Fill out the form below and we&apos;ll get back to you within 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full"
                    placeholder="Enter your email address"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full"
                    placeholder="What's this about?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message *
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full min-h-[120px]"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending Message...
                    </div>
                  ) : (
                    'Send Message'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            ChefDhundo.com – Frequently Asked Questions (FAQs)
          </h2>
          <p className="text-center text-gray-600 max-w-3xl mx-auto mb-10">
            Welcome to ChefDhundo.com! Below you&apos;ll find answers to common questions from both Chefs (Hospitality Candidates) and
            Hospitality Owners. These FAQs are designed to help you navigate our platform with ease and confidence.
          </p>

          <div className="space-y-10">
            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-orange-600 text-center">FAQs for Chefs (Hospitality Candidates)</h3>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-orange-600">1. Do I have to pay for submitting my resume on ChefDhundo.com?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      No, it is completely free for hospitality candidates to submit their resumes and professional details on ChefDhundo.com.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-orange-600">2. How should I submit my resume on ChefDhundo.com?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      After logging in using your Google Sign-In, click on “Submit Resume” and fill out all the required details. Once submitted, a success message will appear. You can also edit or complete your profile anytime from the “My Dashboard” section.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-orange-600">3. How will I receive job vacancy notifications?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Hospitality candidates will receive direct calls from hospitality owners regarding job vacancies. Additionally, ChefDhundo.com displays verified vacancies from across PAN India on the platform.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-orange-600">4. How long does it take to get a job notification?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Usually, it takes 3 to 5 days after submitting your resume to receive a call from a potential hospitality owner. For urgent job assistance, you can also contact the ChefDhundo team directly on WhatsApp: +91 8826147981.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-orange-600 text-center">FAQs for Hospitality Owners</h3>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-orange-600">1. What types of hospitality candidates are available on ChefDhundo?</CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-600 space-y-3">
                    <p>ChefDhundo currently offers a wide range of verified candidates, including:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Kitchen Helpers</li>
                      <li>Commis Chefs</li>
                      <li>Sous Chefs</li>
                      <li>Head Chefs</li>
                      <li>Executive Chefs</li>
                      <li>Baristas</li>
                      <li>Stewards</li>
                    </ul>
                    <p>
                      Available across cuisines such as Indian, Chinese, South Indian, Tandoor, and Indian Tandoor. (More roles and specializations will be added soon.)
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-orange-600">2. How can I access all the candidate profiles?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      You can get instant access to all verified chef profiles by clicking on “Upgrade to Pro” at
                      <a href="https://chefdhundo.com/findchefs" className="text-orange-600 underline ml-1" target="_blank" rel="noreferrer">
                        https://chefdhundo.com/findchefs
                      </a>.
                      Access is granted immediately once the payment is successfully completed.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-orange-600">3. What payment methods are available?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">We support multiple secure payment options, including:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>UPI</li>
                      <li>Credit/Debit Cards</li>
                      <li>Wallet Payments</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-orange-600">4. Whom should I contact if I face issues accessing chef profiles?</CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-600 space-y-2">
                    <p>You can reach out to our support team anytime:</p>
                    <p>📞 Phone: +91 8826147981</p>
                    <p>📧 Email: contact@ihmgurukul.com</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-orange-600">5. How will I know if my subscription is successful and when it will expire?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Once your payment is successful, you’ll receive a confirmation email from ChefDhundo. Additionally, an SMS reminder will be sent to you before your subscription renewal date.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            <p className="text-center text-gray-700 font-medium">
              If you have more questions, feel free to reach out to us. We&apos;re here to help you hire and get hired—faster, smarter, and better!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
