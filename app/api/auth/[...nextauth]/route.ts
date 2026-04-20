import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const API = process.env.API_URL || "https://api.kasaadvisory.com";

export const runtime = 'edge';
export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totp: { label: "MFA Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          // Step 1: Password login
          const res = await fetch(`${API}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });
          if (!res.ok) return null;
          const data = await res.json();
          // Login returns { token, user: {...} }
          const user = data.user || data;

          // Step 2: Check if MFA is required
          if (user.totp_enabled) {
            // MFA required but no code provided — block login
            if (!credentials.totp) return null;
            
            const mfa = await fetch(`${API}/auth/mfa/validate`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: credentials.email,
                code: credentials.totp,
              }),
            }).then(r => r.json());

            if (!mfa.valid) return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenant_id: user.tenant_id,
            tenant_name: user.tenant_name,
            totp_enabled: user.totp_enabled ?? false,
          };
        } catch { return null; }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.tenant_id = (user as any).tenant_id;
        token.tenant_name = (user as any).tenant_name;
        token.totp_enabled = (user as any).totp_enabled;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).tenant_id = token.tenant_id;
        (session.user as any).tenant_name = token.tenant_name;
        (session.user as any).totp_enabled = token.totp_enabled;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" as const },
  secret: process.env.NEXTAUTH_SECRET || "peppol-nextauth-secret-2026",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
