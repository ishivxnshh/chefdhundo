"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import Script from "next/script";

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayFailureResponse {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: {
      order_id: string;
      payment_id: string;
    };
  };
}

interface RazorpayPaymentProps {
  amount: number;
  planName: string;
  planId: string;
  planDurationDays: number;
  customerPhone?: string;
  onSuccess?: (response: RazorpaySuccessResponse) => void;
  onFailure?: (error: RazorpayFailureResponse | unknown) => void;
  disabled?: boolean;
  className?: string;
}

interface RazorpayOrderResponse {
  success: boolean;
  orderId: string;
  internalOrderId: string;
  keyId: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  error?: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: {
    address: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (
    event: string,
    handler: (response: RazorpayFailureResponse) => void
  ) => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const RazorpayPayment: React.FC<RazorpayPaymentProps> = ({
  amount,
  planName,
  planId,
  planDurationDays,
  customerPhone,
  onSuccess,
  onFailure,
  disabled = false,
  className = "",
}) => {
  const { user, isLoaded } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    if (!isLoaded || !user) {
      toast.error("Please sign in to continue with payment.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create Order
      const response = await fetch("/api/payment/razorpay/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          planName,
          planId,
          planDurationDays,
          userId: user.id,
          customerName: user.fullName || user.firstName || "User",
          customerEmail: user.primaryEmailAddress?.emailAddress || "",
          customerPhone:
            customerPhone || user.primaryPhoneNumber?.phoneNumber || "",
        }),
      });

      const data = (await response.json()) as RazorpayOrderResponse;

      if (!data.success) {
        throw new Error(data.error || "Failed to create order");
      }

      // 2. Initialize Razorpay Checkout
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Chef Dhundo",
        description: `Upgrade to ${planName}`,
        image: "/website/icons/logo.png", // Ensure this path is correct
        order_id: data.orderId,
        handler: async function (response: RazorpaySuccessResponse) {
          // 3. Verify Payment
          try {
            const verifyResponse = await fetch("/api/payment/razorpay/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                internal_order_id: data.internalOrderId,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              toast.success("Payment successful! Plan upgraded.");
              onSuccess?.(verifyData);
              // Redirect or refresh page
              window.location.href = "/dashboard";
            } else {
              toast.error(
                "Payment verification failed. Please contact support."
              );
              onFailure?.(verifyData);
            }
          } catch (error) {
            console.error("Verification error:", error);
            toast.error("Error verifying payment.");
            onFailure?.(error);
          }
        },
        prefill: {
          name: data.customerName,
          email: data.customerEmail,
          contact: data.customerPhone,
        },
        notes: {
          address: "Chef Dhundo Corporate Office",
        },
        theme: {
          color: "#f97316", // Orange color matching your theme
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false);
            toast("Payment cancelled");
          },
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on("payment.failed", function (response: RazorpayFailureResponse) {
        console.error("Payment failed:", response.error);
        toast.error(`Payment failed: ${response.error.description}`);
        setIsLoading(false);
        onFailure?.(response.error);
      });

      rzp1.open();
    } catch (error) {
      console.error("Payment initiation error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to initiate payment"
      );
      setIsLoading(false);
      onFailure?.(error);
    }
  };

  return (
    <>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <Button
        onClick={handlePayment}
        disabled={disabled || isLoading || !isLoaded}
        className={`bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg font-semibold rounded-lg transition-colors ${className}`}
        size="lg"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Processing...
          </div>
        ) : (
          `Upgrade Now - ₹${amount}`
        )}
      </Button>
    </>
  );
};

export default RazorpayPayment;
