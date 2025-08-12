import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

const PUBLIC_ROUTES = ['/login', '/api/auth/login'];
const AUTH_ROUTES = ['/login'];
const API_PUBLIC_ROUTES = ['/api/auth/login', '/api/files'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token');

  // Allow public API routes and file access
  if (pathname.startsWith('/api/files/')) {
    return NextResponse.next();
  }

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname) || 
                        API_PUBLIC_ROUTES.some(route => pathname.startsWith(route));
  
  // If no token and trying to access protected route
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If has token, verify it
  if (token) {
    const payload = await verifyToken(token.value);
    
    // If token is invalid and trying to access protected route
    if (!payload && !isPublicRoute) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth-token');
      return response;
    }

    // If valid token and trying to access auth routes (login), redirect to dashboard
    if (payload && AUTH_ROUTES.includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).* )',
  ],
};