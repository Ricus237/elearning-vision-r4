import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  
  // Get auth cookies
  const moodleUserId = request.cookies.get('moodle_user_id')?.value;
  const moodleToken = request.cookies.get('moodle_token')?.value;
  const isAdmin = request.cookies.get('moodle_is_admin')?.value === 'true';

  // Protected routes check
  const isAdminRoute = pathname.startsWith('/admin');
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isExamRoute = pathname.startsWith('/exam');

  const userEmail = request.cookies.get('user_email')?.value;

  if (isAdminRoute) {
    if (!moodleUserId || !moodleToken || !isAdmin) {
      const callbackUrl = encodeURIComponent(`${pathname}${search}`);
      return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, request.url));
    }
  }

  if (isDashboardRoute || isExamRoute) {
    // Session robuste : il faut l'ID ET le Token
    if (!moodleUserId || !moodleToken) {
      // Exception pour l'email de paiement (cas spécial du checkout)
      if (!userEmail) {
        const callbackUrl = encodeURIComponent(`${pathname}${search}`);
        return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, request.url));
      }
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);
  requestHeaders.set('x-url', request.url);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Config to limit the middleware to specific paths
export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/exam/:path*',
  ],
};
