import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdmin = token?.role === 'ADMIN';
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');

    // Redirect non-admins trying to access admin routes
    if (isAdminRoute && !isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages and root (which redirects) without token
        if (req.nextUrl.pathname === '/' ||
            req.nextUrl.pathname.startsWith('/login') || 
            req.nextUrl.pathname.startsWith('/register') ||
            req.nextUrl.pathname.startsWith('/auth/error')) {
          return true;
        }
        // Require token for all other routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/tasks/:path*',
    '/api/habits/:path*',
    '/api/analytics/:path*',
    '/api/team/:path*',
    '/api/admin/:path*',
  ],
};
