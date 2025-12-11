import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import NextTopLoader from "nextjs-toploader";

import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { ClerkProvider } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import AnnouncementProvider from "@/components/AnnouncementProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { getOrCreateServerUser } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import Footer from "@/components/Footer";
import { Chatbot } from "@/components/chatbot";

// Skeleton for footer
function FooterSkeleton() {
  return (
    <footer className="bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <Skeleton className="h-32 w-full bg-gray-700" />
      </div>
    </footer>
  );
}

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Font optimization for faster text paint
});

export const metadata: Metadata = {
  title: "Chef Dhundo - Find & Hire Top Hospitality Staff",
  description: "Connect with trusted hospitality staffs PAN India.",
  keywords:
    "chef hiring, hospitality staff, kitchen professionals, restaurant hiring, hotel staff, chef jobs india",
  authors: [{ name: "ChefDhundo" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://www.chefdhundo.com",
    title: "Chef Dhundo - Professional Chef Hiring Platform",
    description:
      "Find and hire experienced chefs and kitchen staff for your restaurant, hotel, or catering business.",
    siteName: "ChefDhundo",
  },
  icons: {
    icon: "/website/home/logo.png",
    shortcut: "/website/icons/logo.png",
    apple: "/website/icons/logo.png",
    other: {
      rel: "apple-touch-icon-precomposed",
      url: "/website/icons/apple-touch-icon-precomposed.png",
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Hardcoded Clerk publishable key for build
  //const publishableKey = 'pk_live_Y2xlcmsuY2hlZmRodW5kby5jb20k';
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // Server-side auth: fetch Clerk user and Supabase user data
  // Server-side auth: fetch Clerk user and Supabase user data
  let clerkUser = null;
  try {
    clerkUser = await currentUser();
  } catch (err) {
    // This typically happens on 404s for static assets where middleware is skipped
    // We can safely ignore this and treat the user as signed out
    console.warn("Auth check failed (likely static asset 404):", err);
  }

  let supabaseUser = null;

  if (clerkUser) {
    // Get or create user in Supabase (happens server-side, no loading state!)
    supabaseUser = await getOrCreateServerUser(clerkUser);
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en">
        <head>
          <Script
            async
            src="https://www.googletagmanager.com/gtag/js?id=G-K9WJC4QQ37"
          />

          <Script id="google-analytics">
            {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-K9WJC4QQ37');
          `}
          </Script>
        </head>
        <body className={inter.className}>
          <NextTopLoader
            color="#f97316"
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px #f97316,0 0 5px #f97316"
          />
          <AuthProvider initialUser={supabaseUser}>
            <Navbar />
            <Suspense fallback={null}>
              <AnnouncementProvider />
            </Suspense>
            <main className="min-h-screen pt-16">
              {children}
              <Analytics />
            </main>
            <Suspense fallback={<FooterSkeleton />}>
              <Footer />
            </Suspense>
            <Suspense fallback={null}>
              <Chatbot />
            </Suspense>
            <Toaster
              toastOptions={{
                classNames: {
                  toast: "bg-white border-gray-200",
                  title: "text-black",
                  description: "text-gray-600",
                  actionButton: "bg-gray-800 text-white",
                  cancelButton: "bg-gray-200 text-black",
                },
              }}
            />
          </AuthProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
