'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { XCircle, RefreshCw, ArrowLeft, Mail, Phone, AlertCircle, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface StatusData {
  success: boolean;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  payment?: {
    order_id: string;
    plan_name?: string | null;
    amount?: number | null;
    transaction_id?: string | null;
    payment_method?: string | null;
    error_message?: string | null;
  };
  error?: string;
}

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id');
  const initialError = searchParams.get('error');

  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchStatus = async () => {
    if (!orderId) {
      setFetchError('Order ID missing');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/payment/status?order_id=${encodeURIComponent(orderId)}`);
      const json: StatusData = await res.json();
      setStatusData(json);
      setLoading(false);
      // Redirect if payment actually succeeded
      if (json.status === 'SUCCESS') {
        router.replace(`/payment/success?order_id=${orderId}`);
      } else if (json.status === 'PENDING') {
        // Send back to processing screen for live polling
        router.replace(`/payment?order_id=${orderId}`);
      }
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : 'Failed to fetch status');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const handleRetryPayment = () => {
    router.push('/upgrade');
  };

  const handleGoBack = () => {
    router.push('/findchefs');
  };

  const handleContactSupport = () => {
    router.push('/contact');
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchStatus();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-red-600 text-lg">Fetching payment status...</p>
        </div>
      </div>
    );
  }

  const resolvedStatus = statusData?.status || 'FAILED';
  const isCancelled = resolvedStatus === 'CANCELLED';
  const isFailed = resolvedStatus === 'FAILED';

  const errorMessage = statusData?.payment?.error_message || statusData?.error || initialError || fetchError || (isCancelled ? 'Payment was cancelled.' : 'Payment processing failed.');
  const planName = statusData?.payment?.plan_name || 'Pro Subscription';
  const amount = statusData?.payment?.amount || null;
  const transactionId = statusData?.payment?.transaction_id || null;
  const paymentMethod = statusData?.payment?.payment_method || null;
  const displayOrderId = statusData?.payment?.order_id || orderId || 'N/A';

  return (
    <div className={`min-h-screen ${isCancelled ? 'bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50' : 'bg-gradient-to-br from-red-50 via-rose-50 to-pink-50'}`}>      
      <main className="pt-16">
        <div className="max-w-4xl mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mb-6 flex justify-center"
            >
              <div className={`w-24 h-24 ${isCancelled ? 'bg-yellow-100' : 'bg-red-100'} rounded-full flex items-center justify-center`}>                
                {isCancelled ? <Ban className="w-16 h-16 text-yellow-600" /> : <XCircle className="w-16 h-16 text-red-600" />}
              </div>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {isCancelled ? 'Payment Cancelled' : 'Payment Failed'}
            </h1>
            <p className={`text-lg md:text-xl ${isCancelled ? 'text-yellow-700' : 'text-gray-600'} mb-2`}>
              {isCancelled ? 'You cancelled the payment or it was aborted.' : 'We encountered an issue processing your payment'}
            </p>
            {!isCancelled && (
              <p className="text-base text-gray-500">Don&apos;t worry, no charges were made to your account</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card className="bg-white shadow-xl rounded-2xl p-8 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Transaction Details</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Order ID</span>
                  <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded">{displayOrderId}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Status</span>
                  <span className={`flex items-center font-semibold ${isCancelled ? 'text-yellow-600' : 'text-red-600'}`}>                    {isCancelled ? <Ban className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                    {isCancelled ? 'Cancelled' : 'Failed'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-semibold text-gray-900">{planName}</span>
                </div>
                {amount && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-600">Amount</span>
                    <span className="font-semibold text-gray-900">₹{amount}</span>
                  </div>
                )}
                {transactionId && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-600">Transaction ID</span>
                    <span className="font-mono text-xs bg-gray-100 px-3 py-1 rounded break-all">{transactionId}</span>
                  </div>
                )}
                {paymentMethod && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-600">Method</span>
                    <span className="font-semibold capitalize text-gray-900">{paymentMethod}</span>
                  </div>
                )}
                <div className={`${isCancelled ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'} rounded-lg p-4 mt-4`}>
                  <div className="flex items-start">
                    <AlertCircle className={`w-5 h-5 ${isCancelled ? 'text-yellow-600' : 'text-red-600'} mr-3 mt-0.5 flex-shrink-0`} />
                    <div>
                      <p className={`text-sm font-semibold ${isCancelled ? 'text-yellow-900' : 'text-red-900'} mb-1`}>                      {isCancelled ? 'Cancellation Reason' : 'Error Message'}
                      </p>
                      <p className={`text-sm ${isCancelled ? 'text-yellow-800' : 'text-red-800'}`}>{errorMessage}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {!isCancelled && isFailed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mb-8"
            >
              <Card className="bg-white shadow-lg rounded-2xl p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Common Issues & Solutions</h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Insufficient Funds</h3>
                      <p className="text-sm text-gray-600">Please check your account balance and try again</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Card Declined</h3>
                      <p className="text-sm text-gray-600">Your card may have been declined by your bank. Try another payment method</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Network Issue</h3>
                      <p className="text-sm text-gray-600">Check your internet connection and try again</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Incorrect Details</h3>
                      <p className="text-sm text-gray-600">Verify your card details, CVV, and expiration date</p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 mb-8"
          >
            <Button onClick={handleRetryPayment} className={`flex-1 ${isCancelled ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-red-600 hover:bg-red-700'} text-white py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200`}>
              <RefreshCw className="w-5 h-5 mr-2" />
              {isCancelled ? 'Choose Another Method' : 'Retry Payment'}
            </Button>
            <Button onClick={handleGoBack} variant="outline" className="flex-1 py-6 text-lg rounded-xl border-2 hover:bg-gray-50 transition-all duration-200">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </Button>
            <Button onClick={handleRefresh} variant="outline" className="flex-1 py-6 text-lg rounded-xl border-2 hover:bg-gray-50 transition-all duration-200">
              <RefreshCw className="w-5 h-5 mr-2" />
              Refresh Status
            </Button>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.5 }}>
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Need Help?</h3>
              <p className="text-sm text-gray-600 mb-6 text-center">Our support team is here to help you resolve any payment issues</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleContactSupport} variant="outline" className="flex-1 py-4 border-2 hover:bg-white transition-all duration-200">
                  <Mail className="w-4 h-4 mr-2" />Contact Support
                </Button>
                <Button variant="outline" className="flex-1 py-4 border-2 hover:bg-white transition-all duration-200" onClick={() => window.open('tel:+919876543210')}>
                  <Phone className="w-4 h-4 mr-2" />Call Support
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-4 text-center">Available Monday to Friday, 9 AM - 6 PM IST</p>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    }>
      <PaymentFailedContent />
    </Suspense>
  );
}