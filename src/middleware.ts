import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Return next response if authenticated
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    }
  }
)

export const config = {
  // Protect all routes except /login, api routes, static files
  matcher: ['/((?!login|api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
