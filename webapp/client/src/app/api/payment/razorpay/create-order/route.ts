import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/supabase";
import Razorpay from "razorpay";
import { syntheticIdToPhone } from "@/lib/auth/server";
import {
  resolveRazorpayKeyId,
  resolveRazorpayKeySecret,
} from "@/lib/razorpay/config";

const supabase = createClient<Database>(
  process.env.SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

const PLANS = {
  "1week": { name: "1 Week Trial", amount: 99, durationDays: 7 },
  "1month": { name: "Monthly Plan", amount: 300, durationDays: 30 },
  "3months": { name: "Quarterly Plan", amount: 500, durationDays: 90 },
  "6months": { name: "Semi-Annual Plan", amount: 900, durationDays: 180 },
} as const;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { planId } = await request.json();
    const plan = PLANS[planId as keyof typeof PLANS];
    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Invalid plan." },
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

    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("id, name")
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

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    const internalOrderId = `order_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 10)}`.slice(0, 45);

    const order = await razorpay.orders.create({
      amount: plan.amount * 100,
      currency: "INR",
      receipt: internalOrderId,
      notes: {
        plan_id: planId,
        plan_name: plan.name,
        user_id: userId,
      },
    });

    const { error: paymentInsertError } = await supabase
      .from("payments")
      .insert({
        user_id: userRecord.id,
        order_id: internalOrderId,
        razorpay_order_id: order.id,
        plan_id: planId,
        plan_name: plan.name,
        amount: plan.amount,
        currency: "INR",
        status: "PENDING",
        metadata: {
          plan_duration_days: plan.durationDays,
          razorpay_response: order as unknown as Json,
        },
      });

    if (paymentInsertError) {
      console.error("Failed to record payment in Supabase:", paymentInsertError);
      return NextResponse.json(
        { success: false, error: "Failed to record payment order." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      internalOrderId,
      keyId,
      amount: order.amount,
      currency: order.currency,
      customerName:
        userRecord.name || syntheticIdToPhone(userId) || "Mobile account",
      customerPhone: syntheticIdToPhone(userId) || "",
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
