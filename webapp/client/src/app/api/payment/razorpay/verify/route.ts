import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import crypto from "crypto";
import { resolveRazorpayKeySecret } from "@/lib/razorpay/config";

const supabase = createClient<Database>(
  process.env.SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      internal_order_id,
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Missing required payment details." },
        { status: 400 }
      );
    }

    const keySecret = resolveRazorpayKeySecret();
    if (!keySecret) {
      return NextResponse.json(
        { success: false, error: "Razorpay secret not configured." },
        { status: 500 }
      );
    }

    // Verify signature
    const generated_signature = crypto
      .createHmac("sha256", keySecret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment verification failed. Invalid signature.",
        },
        { status: 400 }
      );
    }

    // Payment is successful, update database
    // Find the payment record using internal_order_id or razorpay_order_id
    let query = supabase.from("payments").select("*");
    if (internal_order_id) {
      query = query.eq("order_id", internal_order_id);
    } else {
      query = query.eq("razorpay_order_id", razorpay_order_id);
    }

    const { data: paymentData, error: paymentError } = await query.single();

    if (paymentError || !paymentData) {
      console.error("Payment record not found:", paymentError);
      return NextResponse.json(
        { success: false, error: "Payment record not found." },
        { status: 404 }
      );
    }

    // Update payment status
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: "SUCCESS",
        razorpay_payment_id,
        razorpay_signature,
        payment_method: "razorpay", // You might want to fetch payment details from Razorpay API to get exact method
        payment_time: new Date().toISOString(),
      })
      .eq("id", paymentData.id);

    if (updateError) {
      console.error("Failed to update payment status:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update payment status." },
        { status: 500 }
      );
    }

    // Update user role to pro
    const { data: currentUserRow } = await supabase
      .from("users")
      .select("role")
      .eq("id", paymentData.user_id)
      .single();

    if (currentUserRow?.role !== "admin") {
      await supabase
        .from("users")
        .update({ role: "pro" })
        .eq("id", paymentData.user_id);
    }

    // Create subscription
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("payment_id", paymentData.id)
      .single();

    if (!existingSub) {
      const metadata = paymentData.metadata as {
        plan_duration_days?: number;
      } | null;
      const planDurationDays = metadata?.plan_duration_days || 30;
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + planDurationDays);

      await supabase.from("subscriptions").insert({
        user_id: paymentData.user_id,
        payment_id: paymentData.id,
        plan_id: paymentData.plan_id,
        plan_name: paymentData.plan_name,
        plan_duration_days: planDurationDays,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: "ACTIVE",
        auto_renew: false,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified and processed successfully.",
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error during verification.",
      },
      { status: 500 }
    );
  }
}
