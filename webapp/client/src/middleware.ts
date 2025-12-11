import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/findchefs',
  '/chef/:path*',
  '/contact',
  '/terms',
  '/refunds',
  '/payment/:path*',
  '/upgrade',
  '/dashboard',
  '/dashboard/:path*',
  '/admin',
  '/admin/:path*',
  '/policy/privacy',
  '/policy/shipping',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/admin/:path*'
]);

export default clerkMiddleware(async (auth, request) => {
  // const { userId } = await auth()
  
  // Log for debugging production issues
  // console.log(`Middleware: ${request.method} ${request.nextUrl.pathname}, userId: ${userId}`)

  if (!isPublicRoute(request)) {
    const pathname = request.nextUrl?.pathname || ''
    const isApi = pathname.startsWith('/api') || pathname.startsWith('/trpc') || /\/api\//.test(pathname)

    // For API requests, don't redirect - let API routes handle auth
    if (!isApi) {
      // For protected pages, use protect() with unauthenticatedUrl to prevent nested redirects
      await auth.protect({
        unauthenticatedUrl: '/sign-in',
        unauthorizedUrl: '/'
      });
    }
  }
  
  return NextResponse.next()
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
