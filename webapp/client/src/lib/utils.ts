import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function to mask phone number for basic users
export function maskPhone(phone: string, userRole: string): string {
  if (userRole === 'pro' || userRole === 'admin') {
    return phone;
  }
  
  // For basic users, mask the phone number
  if (!phone || phone.length < 4) return phone;
  
  // Keep first 2 digits and last 2 digits, mask the middle
  const firstTwo = phone.substring(0, 2);
  const lastTwo = phone.substring(phone.length - 2);
  const middleLength = phone.length - 4;
  
  if (middleLength <= 0) return phone;
  
  const maskedMiddle = 'x'.repeat(middleLength);
  return `${firstTwo}${maskedMiddle}${lastTwo}`;
}
