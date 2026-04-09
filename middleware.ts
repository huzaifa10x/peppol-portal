import { withAuth } from "next-auth/middleware";

// Exporting withAuth explicitly ensures Next.js sees a function
export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/((?!login|register|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};