import { NextRequest, NextResponse } from "next/server";
import { auth, syntheticIdToPhone } from "@/lib/auth/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import crypto from "crypto";
import { resolveRazorpayKeySecret } from "@/lib/razorpay/config";

// ================================================
// 📱 WAHA WhatsApp – direct send helper
// ================================================
async function sendWahaMessage(phone: string, text: string): Promise<void> {
  const wahaUrl = process.env.WAHA_URL;
  const wahaKey = process.env.WAHA_API_KEY;
  const wahaSession = process.env.WAHA_SESSION || "default";

  if (!wahaUrl || !wahaKey) {
    console.warn("⚠️ WAHA_URL or WAHA_API_KEY not set — skipping WhatsApp notification");
    return;
  }

  // Convert +91XXXXXXXXXX → 91XXXXXXXXXX@c.us (WAHA chatId format)
  const chatId = phone.replace("+", "") + "@c.us";

  const response = await fetch(`${wahaUrl}/api/sendText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": wahaKey,
    },
    body: JSON.stringify({ session: wahaSession, chatId, text }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`WAHA sendText failed (${response.status}): ${err}`);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


const supabase = createClient<Database>(
  process.env.SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

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
      query = query
        .eq("order_id", internal_order_id)
        .eq("razorpay_order_id", razorpay_order_id);
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

    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", userId)
      .single();

    if (userError || !userRecord || userRecord.id !== paymentData.user_id) {
      return NextResponse.json(
        { success: false, error: "Forbidden." },
        { status: 403 }
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

    // ================================================
    // 📱 WhatsApp – Payment Success Notification
    // Fire-and-forget: payment response is never delayed or blocked.
    // If WAHA is unreachable the payment still succeeds normally.
    // ================================================
    void (async () => {
      console.log("[STEP 1] Starting purchase flow");
      
      // userId = session.sub = clerk_user_id = "phone:+91XXXXXXXXXX"
      const phone = syntheticIdToPhone(userId);
      if (!phone) {
        console.warn("⚠️ Could not extract phone from userId for WhatsApp notification");
        return;
      }

      const planName = paymentData.plan_name;

      const msg1 =
        `✨ Thank you for choosing us! Your purchase has been successfully received, and we can't wait for you to enjoy what's coming next.

You can log in to ChefDhundo.com and click on Find Chefs. There you'll see 80+ resumes and more.`;

      const msg2 =
        `Greetings Sir,

You've got access to 500+ hospitality candidates PAN India.

Few of them you can get through our official website and the rest I've attached below with their complete reference.

https://tinyurl.com/2ffwfdzb

https://tinyurl.com/37er5zsv`;

      const msg3 =
        `Please send your information:

Restaurant name & Location:

Facilities you'll be providing:

Salary for staff:

Staff Required:

Contact to send resume on:`;

      console.log(`📱 Sending payment success WhatsApp to ${phone} (${planName})`);

      try {
        console.log("[STEP 2] Sending thank you message");
        await sendWahaMessage(phone, msg1);
        console.log("[STEP 3] Thank you message sent");
      } catch (err) {
        console.error("❌ Failed to send thank you message:", err instanceof Error ? err.message : String(err));
      }

      await delay(3000);

      try {
        console.log("[STEP 4] Sending login instructions");
        await sendWahaMessage(phone, msg2);
        console.log("[STEP 5] Login instructions sent");
      } catch (err) {
        console.error("❌ Failed to send login instructions:", err instanceof Error ? err.message : String(err));
      }

      await delay(3000);

      try {
        console.log("[STEP 6] Sending resume access / onboarding message");
        await sendWahaMessage(phone, msg3);
        console.log("[STEP 7] Resume access / onboarding message sent");
      } catch (err) {
        console.error("❌ Failed to send resume access / onboarding message:", err instanceof Error ? err.message : String(err));
      }

      console.log(`✅ Payment success WhatsApp flow completed for ${phone}`);
    })();

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
