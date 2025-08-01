import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Known domain slugs - in production this would come from a database or API
const domainSlugs = [
  'maven-hub',
  'wealth-on-wheels',
  'bemnet',
  'pacci'
];

// Custom middleware that runs after NextAuth authentication check
export default withAuth(
  function middleware(request: any) {
    const { pathname } = request.nextUrl;
    
    
    // Check if this is a domain route by looking at the first segment
    const pathSegments = pathname.split('/').filter(Boolean);
    const firstSegment = pathSegments[0];
    
    // Check if the first segment matches a known domain slug
    const isDomainRoute = firstSegment && domainSlugs.includes(firstSegment);
    
    // If it's a domain route and user is not authenticated, set cookie
    if (isDomainRoute && !request.nextauth.token) {
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

    // Pass through - user is authenticated or accessing public route
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Public routes that don't require authentication
        const publicPaths = [
          '/auth',
          '/api/auth', // NextAuth routes
          '/api/domains', // Public domain list
          '/api/camunda/webhook', // Camunda webhooks don't need user auth
        ];
        
        // Check if the path is public
        const isPublicPath = publicPaths.some(path => 
          pathname === path || pathname.startsWith(path + '/')
        );
        
        // Allow public paths without auth
        if (isPublicPath) return true;
        
        // All other routes require authentication
        return !!token;
      },
    },
    pages: {
      signIn: '/auth',
    },
  }
);

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