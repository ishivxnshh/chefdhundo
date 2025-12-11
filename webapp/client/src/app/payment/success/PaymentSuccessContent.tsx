'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const orderId = searchParams.get('order_id');
  
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [planName, setPlanName] = useState<string>('Pro Subscription');
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Fetch payment details including transaction ID
  useEffect(() => {
    const fetchPaymentDetails = async () => {
      if (!orderId) return;

      try {
        const response = await fetch(`/api/payment/verify?order_id=${orderId}`);
        const result = await response.json();

        if (result.success && result.payment) {
          setTransactionId(result.payment.transaction_id || null);
          setPlanName(result.payment.plan_name || 'Pro Subscription');
        }
      } catch (error) {
        console.error('Error fetching payment details:', error);
      }
    };

    fetchPaymentDetails();
  }, [orderId]);

  const handleUnlockPro = async () => {
    if (!user) {
      toast.error('Please sign in to continue');
      return;
    }

    setIsUnlocking(true);
    toast.loading('Unlocking Pro features...', { id: 'unlock-pro' });

    try {
      // Refresh user data from Supabase to get updated role
      const response = await fetch(`/api/user-supabase?clerk_id=${user.id}`);
      const result = await response.json();

      if (result.success && result.data?.role === 'pro') {
        // Reload Clerk user session to sync the role
        await user.reload();
        
        toast.success('🎉 Pro features unlocked! Redirecting...', { id: 'unlock-pro' });
        
        // Wait a moment for user to see the success message
        setTimeout(() => {
          router.push('/findchefs');
        }, 1500);
      } else {
        toast.warning('Please wait a moment for your account to update', { id: 'unlock-pro' });
        
        // Retry after a short delay
        setTimeout(() => {
          router.push('/findchefs');
        }, 2000);
      }
    } catch (error) {
      console.error('Error unlocking pro:', error);
      toast.error('Failed to unlock. Redirecting anyway...', { id: 'unlock-pro' });
      
      setTimeout(() => {
        router.push('/findchefs');
      }, 1500);
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            Thank you for upgrading to Pro! Your subscription has been activated.
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
          <h3 className="font-semibold text-gray-800 mb-3">Order Details</h3>
          
          {orderId && (
            <div className="mb-2">
              <p className="text-xs text-gray-500">Order ID</p>
              <p className="font-mono text-sm text-gray-800 break-all">{orderId}</p>
            </div>
          )}
          
          {transactionId && (
            <div className="mb-2">
              <p className="text-xs text-gray-500">Transaction ID</p>
              <p className="font-mono text-sm text-gray-800 break-all">{transactionId}</p>
            </div>
          )}
          
          <div>
            <p className="text-xs text-gray-500">Plan</p>
            <p className="text-sm font-semibold text-orange-600">{planName}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">What&apos;s Next?</h3>
            <ul className="text-sm text-green-700 space-y-1 text-left">
              <li>• Access to all chef contact information</li>
              <li>• Unlimited chef searches</li>
              <li>• Direct messaging with chefs</li>
              <li>• Priority customer support</li>
            </ul>
          </div>

          {/* Unlock Pro Button */}
          <Button
            onClick={handleUnlockPro}
            disabled={isUnlocking}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-6 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isUnlocking ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Unlocking Pro Features...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Unlock the Pro
              </>
            )}
          </Button>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link 
              href="/findchefs"
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Find Chefs
            </Link>
            <Link 
              href="/"
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}
