import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicPaths = [
  '/auth',
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/domains' // Public domain list
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and internal Next.js routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    pathname.startsWith('/api/_next')
  ) {
    return NextResponse.next();
  }

  // Check if the path is public
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'));
  
  // Get authentication status from cookies
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;
  
  // If accessing a protected route without tokens, redirect to auth
  if (!isPublicPath && !accessToken && !refreshToken) {
    const authUrl = new URL('/auth', request.url);
    authUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(authUrl);
  }

  // If has refresh token but no access token, let the auth context handle refresh
  // Don't redirect to refresh endpoint from middleware to avoid loops

  // Pass through - let the page handle any further auth checks
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};