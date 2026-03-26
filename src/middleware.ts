import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Handle API Proxying (Optional - next.config.ts is usually enough)
  // If you need more complex logic than next.config.ts rewrites:
  if (pathname.startsWith('/api/proxy')) {
    const targetUrl = new URL(
      pathname.replace('/api/proxy', '/api'),
      'http://localhost:3001'
    );
    return NextResponse.rewrite(targetUrl);
  }

  // 2. Simple Auth Protection (Tenant check)
  // Check for auth token in cookies/headers
  const token = request.cookies.get('token')?.value;
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isAdminPage = pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/invoices');

  if (isAdminPage && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (internal next.js api routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
