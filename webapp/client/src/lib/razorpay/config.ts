export const resolveRazorpayKeyId = (): string => {
  const keyId =
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
  if (!keyId) {
    console.warn("Razorpay Key ID is not defined");
    return "";
  }
  return keyId;
};

export const resolveRazorpayKeySecret = (): string => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    console.warn("Razorpay Key Secret is not defined");
    return "";
  }
  return keySecret;
};
