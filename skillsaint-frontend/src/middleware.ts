import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  
  // Get auth cookies
  const moodleUserId = request.cookies.get('moodle_user_id')?.value;
  const isAdmin = request.cookies.get('moodle_is_admin')?.value === 'true';

  // Protected routes check
  const isAdminRoute = pathname.startsWith('/admin');
  const isDashboardRoute = pathname.startsWith('/dashboard');

  const userEmail = request.cookies.get('user_email')?.value;

  if (isAdminRoute) {
    if (!moodleUserId || !isAdmin) {
      const callbackUrl = encodeURIComponent(`${pathname}${search}`);
      return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, request.url));
    }
  }

  if (isDashboardRoute) {
    // Si l'utilisateur n'a ni ID Moodle ni email (cas du paiement récent), on redirige
    if (!moodleUserId && !userEmail) {
      const callbackUrl = encodeURIComponent(`${pathname}${search}`);
      return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, request.url));
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
  ],
};
