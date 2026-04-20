import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== 'production';

const cspHeader = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline' https:",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''} https://www.googletagmanager.com https://va.vercel-scripts.com https://clerk.chefdhundo.com https://accounts.chefdhundo.com https://*.clerk.accounts.dev https://checkout.razorpay.com`.replace(/\s+/g, ' ').trim(),
  `script-src-elem 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''} https://www.googletagmanager.com https://va.vercel-scripts.com https://clerk.chefdhundo.com https://accounts.chefdhundo.com https://*.clerk.accounts.dev https://checkout.razorpay.com`.replace(/\s+/g, ' ').trim(),
  "script-src-attr 'unsafe-inline'",
  "connect-src 'self' https: wss: https://api.razorpay.com https://checkout.razorpay.com",
  "frame-src 'self' https://clerk.chefdhundo.com https://accounts.chefdhundo.com https://*.clerk.accounts.dev https://api.razorpay.com https://checkout.razorpay.com",
].join('; ');

const nextConfig: NextConfig = {
  compiler: {
    // Remove console.logs in production (keep error and warn)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol : 'https',
        hostname : 'img.clerk.com',
        port: '',
        pathname: '/**',
      }
    ],
    qualities: [100], // Add all qualities you use (e.g., 75, 80, 90, 100)
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
        ],
      },
    ];
  },
  output: 'standalone',
};

export default nextConfig;
