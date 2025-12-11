import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/supabase";
import Razorpay from "razorpay";
import {
  resolveRazorpayKeyId,
  resolveRazorpayKeySecret,
} from "@/lib/razorpay/config";

const supabase = createClient<Database>(
  process.env.SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

export async function POST(request: NextRequest) {
  try {
    const {
      amount,
      planName,
      planId,
      planDurationDays,
      userId,
      customerName,
      customerEmail,
      customerPhone,
    } = await request.json();

    if (!amount || amount < 1) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid amount. Amount must be at least ₹1.",
        },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required." },
        { status: 400 }
      );
    }

    const keyId = resolveRazorpayKeyId();
    const keySecret = resolveRazorpayKeySecret();

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { success: false, error: "Razorpay credentials are not configured." },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // Fetch the internal user row to link payment to Supabase user ID
    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("clerk_user_id", userId)
      .single();

    if (userError || !userRecord) {
      console.error("User not found for payment order:", userError);
      return NextResponse.json(
        {
          success: false,
          error: "User record not found. Please re-login and try again.",
        },
        { status: 404 }
      );
    }

    const orderSuffix = Math.random().toString(36).slice(2, 10);
    const internalOrderId = `order_${Date.now().toString(
      36
    )}_${orderSuffix}`.slice(0, 45);

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency: "INR",
      receipt: internalOrderId,
      notes: {
        plan_id: planId,
        plan_name: planName,
        user_id: userId,
      },
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Failed to create Razorpay order." },
        { status: 500 }
      );
    }

    // Store payment record in Supabase for later verification
    const { error: paymentInsertError } = await supabase
      .from("payments")
      .insert({
        user_id: userRecord.id,
        order_id: internalOrderId,
        razorpay_order_id: order.id,
        plan_id: planId,
        plan_name: planName,
        amount,
        currency: "INR",
        status: "PENDING",
        metadata: {
          plan_duration_days: planDurationDays,
          razorpay_response: order as unknown as Json,
        },
      });

    if (paymentInsertError) {
      console.error(
        "Failed to record payment in Supabase:",
        paymentInsertError
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      internalOrderId,
      keyId,
      amount: order.amount,
      currency: order.currency,
      customerName: customerName || userRecord.name || "User",
      customerEmail: customerEmail || userRecord.email,
      customerPhone: customerPhone || "",
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error while creating order.",
      },
      { status: 500 }
    );
  }
}
