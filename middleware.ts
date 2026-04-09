import { withAuth } from "next-auth/middleware";

// Exporting withAuth explicitly ensures Next.js sees a function
export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - login
     * - register
     * - api/auth (NextAuth internal routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!login|register|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};