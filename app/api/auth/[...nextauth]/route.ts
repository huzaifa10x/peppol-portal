import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const BASE = process.env.API_URL || 
             process.env.NEXT_PUBLIC_API_URL || 
             "https://api.kasaadvisory.com";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const res = await fetch(`${BASE}/auth/login`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({
              email:    credentials.email,
              password: credentials.password,
            }),
          });
          if (!res.ok) {
            console.error("Auth failed:", res.status, await res.text());
            return null;
          }
          const data = await res.json();
          return {
            id:          data.user.id,
            email:       data.user.email,
            name:        data.user.name,
            role:        data.user.role,
            tenant_id:   data.user.tenant_id,
            tenant_name: data.user.tenant_name,
            tenant_slug: data.user.tenant_slug,
            peppol_id:   data.user.peppol_id,
            plan:        data.user.plan,
            token:       data.token,
          };
        } catch (e) {
          console.error("Auth error:", e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role        = (user as any).role;
        token.tenant_id   = (user as any).tenant_id;
        token.tenant_name = (user as any).tenant_name;
        token.tenant_slug = (user as any).tenant_slug;
        token.peppol_id   = (user as any).peppol_id;
        token.plan        = (user as any).plan;
        token.api_token   = (user as any).token;
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).role        = token.role;
      (session.user as any).tenant_id   = token.tenant_id;
      (session.user as any).tenant_name = token.tenant_name;
      (session.user as any).peppol_id   = token.peppol_id;
      (session.user as any).plan        = token.plan;
      (session.user as any).api_token   = token.api_token;
      return session;
    },
  },
  pages:   { signIn: "/login" },
  session: { strategy: "jwt" },
  secret:  process.env.NEXTAUTH_SECRET || "peppol-nextauth-secret-2026",
});

export { handler as GET, handler as POST };
