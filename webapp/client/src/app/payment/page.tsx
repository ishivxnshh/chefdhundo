"use client";

import React, { useEffect, useState, Suspense, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function PaymentProcessingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'failed' | 'cancelled' | 'timeout'>('processing');
  const [showModal, setShowModal] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [planName, setPlanName] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const timeoutMs = 90_000; // 90s timeout

  const [currentDelayIndex, setCurrentDelayIndex] = useState(0);
  const nextDelay = BACKOFF_DELAYS[Math.min(currentDelayIndex, BACKOFF_DELAYS.length - 1)];

  const pollStatus = useCallback(async () => {
    if (!orderId) return;
    try {
      setAttempts(a => a + 1);
      const response = await fetch(`/api/payment/status?order_id=${encodeURIComponent(orderId)}`);
      const result = await response.json();

      if (result.success && result.payment) {
        setPlanName(result.payment.plan_name || null);
        setAmount(result.payment.amount || null);
        if (result.payment.transaction_id) setTransactionId(result.payment.transaction_id);
        if (result.payment.payment_method) setPaymentMethod(result.payment.payment_method);

        if (result.status === 'SUCCESS') {
          setStatus('success');
          setShowModal(true);
          return;
        } else if (result.status === 'FAILED') {
          setStatus('failed');
          setErrorMessage(result.payment.error_message || result.error || 'Payment failed');
          setShowModal(true);
          return;
        } else if (result.status === 'CANCELLED') {
          setStatus('cancelled');
          setErrorMessage(result.payment.error_message || 'Payment was cancelled');
          setShowModal(true);
          return;
        }
      }

      if (startTimeRef.current) {
        const now = Date.now();
        setElapsedMs(now - startTimeRef.current);
        if (now - startTimeRef.current >= timeoutMs) {
          setStatus('timeout');
          setShowModal(true);
          return;
        }
      }

      setCurrentDelayIndex(i => Math.min(i + 1, BACKOFF_DELAYS.length - 1));
      setTimeout(pollStatus, nextDelay);
    } catch (e) {
      console.error('Status poll error:', e);
      if (startTimeRef.current && Date.now() - startTimeRef.current >= timeoutMs) {
        setStatus('timeout');
        setErrorMessage('Network issue – manual refresh required');
        setShowModal(true);
        return;
      }
      setTimeout(pollStatus, nextDelay);
    }
  }, [orderId, nextDelay, timeoutMs]);

  useEffect(() => {
    const orderIdParam = searchParams.get('order_id');
    const statusParam = searchParams.get('status');
    const errorParam = searchParams.get('error');

    if (orderIdParam) {
      setOrderId(orderIdParam);
      if (!startTimeRef.current) startTimeRef.current = Date.now();
      pollStatus();
    }

    if (errorParam) {
      setErrorMessage(errorParam);
    }

    if (statusParam === 'failed') {
      setStatus('failed');
      setShowModal(true);
    }
  }, [searchParams, pollStatus]);

  const handleSuccessAction = () => {
    router.push(`/payment/success?order_id=${orderId || 'demo123'}`);
  };

  const handleFailureAction = () => {
    router.push(`/payment/failed?order_id=${orderId || 'demo123'}&error=${encodeURIComponent(errorMessage || 'Payment processing failed')}`);
  };

  const handleRetry = () => {
    if (status === 'timeout' && orderId) {
      setStatus('processing');
      setShowModal(false);
      setCurrentDelayIndex(0);
      startTimeRef.current = Date.now();
      pollStatus();
      return;
    }
    router.push('/upgrade');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <main className="pt-16 flex items-center justify-center min-h-screen">
        <div className="max-w-2xl w-full mx-auto px-4 py-20">
          <AnimatePresence mode="wait">
            {status === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="bg-white rounded-2xl shadow-2xl p-12">
                  <div className="mb-6">
                    <Loader2 className="w-20 h-20 text-blue-500 mx-auto animate-spin" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Processing Your Payment</h1>
                  <p className="text-lg text-gray-600 mb-8">Please wait while we securely process your payment. This may take a few moments.</p>
                  <div className="space-y-3 mb-6">
                    {orderId && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-blue-800"><strong>Order ID:</strong> {orderId}</p>
                      </div>
                    )}
                    {planName && (
                      <div className="bg-indigo-50 rounded-lg p-4">
                        <p className="text-sm text-indigo-800"><strong>Plan:</strong> {planName}</p>
                      </div>
                    )}
                    {amount && (
                      <div className="bg-teal-50 rounded-lg p-4">
                        <p className="text-sm text-teal-800"><strong>Amount:</strong> ₹{amount}</p>
                      </div>
                    )}
                    {transactionId && (
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-green-800"><strong>Transaction ID:</strong> {transactionId}</p>
                      </div>
                    )}
                    {paymentMethod && (
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <p className="text-sm text-yellow-800"><strong>Method:</strong> {paymentMethod}</p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-xs text-gray-500"><strong>Attempts:</strong> {attempts}</div>
                    <div className="text-xs text-gray-500"><strong>Elapsed:</strong> {(elapsedMs / 1000).toFixed(0)}s</div>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-gray-500">
                    <CreditCard className="w-5 h-5" />
                    <span className="text-sm">Secure Payment Processing</span>
                  </div>
                  <div className="flex justify-center items-center space-x-2 mt-6">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Dialog open={showModal && status === 'success'} onOpenChange={setShowModal}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                </div>
                <DialogTitle className="text-center text-2xl">Payment Successful!</DialogTitle>
                <DialogDescription className="text-center text-base pt-2">Your payment has been processed successfully.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {orderId && (<p className="text-xs text-gray-600 text-center"><strong>Order:</strong> {orderId}</p>)}
                  {transactionId && (<p className="text-xs text-gray-600 text-center"><strong>Transaction:</strong> {transactionId}</p>)}
                  {paymentMethod && (<p className="text-xs text-gray-600 text-center"><strong>Method:</strong> {paymentMethod}</p>)}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={handleSuccessAction} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 text-lg">Continue</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showModal && (status === 'failed' || status === 'cancelled' || status === 'timeout')} onOpenChange={setShowModal}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-12 h-12 text-red-600" />
                  </div>
                </div>
                <DialogTitle className="text-center text-2xl">{status === 'cancelled' ? 'Payment Cancelled' : status === 'timeout' ? 'Verification Timeout' : 'Payment Failed'}</DialogTitle>
                <DialogDescription className="text-center text-base pt-2">
                  {status === 'cancelled' && 'You cancelled the payment or the gateway reported a cancellation.'}
                  {status === 'timeout' && 'Payment is taking longer than expected. You can retry or view details.'}
                  {status === 'failed' && 'We couldn\'t process your payment. Please try again or contact support if the problem persists.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {(errorMessage || transactionId || paymentMethod) && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-1">
                    {errorMessage && (<p className="text-xs text-red-800 text-center"><strong>Error:</strong> {errorMessage}</p>)}
                    {transactionId && (<p className="text-xs text-red-800 text-center"><strong>Transaction:</strong> {transactionId}</p>)}
                    {paymentMethod && (<p className="text-xs text-red-800 text-center"><strong>Method:</strong> {paymentMethod}</p>)}
                  </div>
                )}
                {orderId && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 text-center"><strong>Order:</strong> {orderId}</p>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={handleRetry} variant="outline" className="flex-1 py-6 text-lg border-2">{status === 'timeout' ? 'Refresh Status' : 'Try Again'}</Button>
                  <Button onClick={handleFailureAction} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-6 text-lg">View Details</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}

// Backoff delays configuration (moved outside component to avoid hook dependency issues)
const BACKOFF_DELAYS = [2000, 4000, 8000, 12000, 16000];

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-500 mx-auto animate-spin mb-4" />
          <p className="text-gray-600 text-lg">Loading payment processor...</p>
        </div>
      </div>
    }>
      <PaymentProcessingContent />
    </Suspense>
  );
}
