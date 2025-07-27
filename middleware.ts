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

// Known domain slugs - in production this would come from a database or API
const domainSlugs = [
  'maven-hub',
  'wealth-on-wheels',
  'bemnet',
  'pacci'
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

  // Check if this is a domain route by looking at the first segment
  const pathSegments = pathname.split('/').filter(Boolean);
  const firstSegment = pathSegments[0];
  
  // Check if the first segment matches a known domain slug
  const isDomainRoute = firstSegment && domainSlugs.includes(firstSegment);
  
  // If it's a domain route and user is not authenticated, set cookie and redirect to auth
  if (isDomainRoute) {
    const accessToken = request.cookies.get('accessToken')?.value;
    const refreshToken = request.cookies.get('refreshToken')?.value;
    
    if (!accessToken && !refreshToken) {
      // Set the intended domain as a cookie
      const response = NextResponse.redirect(new URL('/auth', request.url));
      response.cookies.set('intendedDomain', firstSegment, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 5 // 5 minutes
      });
      return response;
    }
    
    // User is authenticated, allow access
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
    authUrl.searchParams.set('returnUrl', pathname);
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