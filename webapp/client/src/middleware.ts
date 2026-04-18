import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isDashboardRoute = createRouteMatcher(['/dashboard(.*)']);
const isAdminRoute = createRouteMatcher(['/admin(.*)']);

function getRoleFromClaims(sessionClaims: unknown): string {
  const claims = sessionClaims as
    | {
        metadata?: { role?: string };
        publicMetadata?: { role?: string };
        role?: string;
      }
    | undefined;

  return (
    claims?.metadata?.role ||
    claims?.publicMetadata?.role ||
    claims?.role ||
    'user'
  );
}

export default clerkMiddleware(async (auth, req) => {
  if (isDashboardRoute(req) || isAdminRoute(req)) {
    await auth.protect({
      unauthenticatedUrl: new URL('/sign-in', req.url).toString(),
    });
  }

  if (isAdminRoute(req)) {
    const { sessionClaims } = await auth();
    const role = getRoleFromClaims(sessionClaims);

    if (role !== 'admin') {
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }

      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|.*\\..*).*)',
    '/(api|trpc)(.*)',
  ],
};