import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession } from './lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Exclude static assets, api routes, and icons
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get('shakti_session')?.value
  const user = sessionCookie ? await verifySession(sessionCookie) : null

  // If not logged in and not on login page, redirect to /login
  if (!user && pathname !== '/login') {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // If logged in and on login page, redirect to /
  if (user && pathname === '/login') {
    const homeUrl = new URL('/', request.url)
    return NextResponse.redirect(homeUrl)
  }

  // Role-based restrictions
  if (user) {
    // 1. Audit Logs are ADMIN only
    if (pathname.startsWith('/audit-logs') && user.role !== 'ADMIN') {
      const unauthorizedUrl = new URL('/unauthorized', request.url)
      return NextResponse.redirect(unauthorizedUrl)
    }

    // 2. Reconciliation is ADMIN or ACCOUNTANT only
    if (pathname.startsWith('/reconciliation') && !['ADMIN', 'ACCOUNTANT'].includes(user.role)) {
      const unauthorizedUrl = new URL('/unauthorized', request.url)
      return NextResponse.redirect(unauthorizedUrl)
    }

    // 3. Profile details can only be modified by ADMIN
    // (We will let operators view profile page if they just read it, but edit actions will be guarded in the UI & actions)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
