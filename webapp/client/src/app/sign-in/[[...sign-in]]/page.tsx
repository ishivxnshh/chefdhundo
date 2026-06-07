"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((v) => v - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const helperText = useMemo(() => {
    if (cooldown > 0) return `Resend OTP in ${cooldown}s`;
    return "Enter your Indian mobile number";
  }, [cooldown]);

  async function waitForSession() {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const res = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.isSignedIn) return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return false;
  }

  async function sendOtp() {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!data.success) {
        setMessage(data.error || "Could not send OTP");
        return;
      }

      setOtpSent(true);
      setCooldown(60);
      setMessage("OTP sent to your mobile number");
    } catch {
      setMessage("Could not send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtpCode() {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!data.success) {
        setMessage(data.error || "Invalid OTP");
        return;
      }

      setMessage("Login verified. Opening dashboard...");
      const sessionReady = await waitForSession();
      if (!sessionReady) {
        setMessage("Login cookie was not confirmed. Please try again.");
        return;
      }

      const nextPath = searchParams.get("next") || "/dashboard";
      window.location.replace(nextPath);
    } catch {
      setMessage("Could not verify OTP");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center mb-2">Login with Mobile OTP</h1>
        <p className="text-sm text-gray-500 text-center mb-6">{helperText}</p>

        <label className="block text-sm font-medium mb-2">Mobile Number</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="9876543210"
          className="w-full border rounded-lg px-4 py-3 mb-4"
          disabled={otpSent}
        />

        {otpSent && (
          <>
            <label className="block text-sm font-medium mb-2">OTP</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6 digit OTP"
              className="w-full border rounded-lg px-4 py-3 mb-2"
              maxLength={6}
            />
          </>
        )}

        {message && (
          <p
            className={`text-sm text-center mb-4 ${
              message.includes("sent") ? "text-green-700" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}

        {!otpSent ? (
          <button
            type="button"
            onClick={sendOtp}
            disabled={loading}
            className="w-full bg-black text-white rounded-lg py-3 disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={verifyOtpCode}
              disabled={loading}
              className="w-full bg-black text-white rounded-lg py-3 disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Login"}
            </button>
            <button
              type="button"
              onClick={sendOtp}
              disabled={loading || cooldown > 0}
              className="w-full border border-gray-300 text-gray-700 rounded-lg py-3 disabled:opacity-60"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
