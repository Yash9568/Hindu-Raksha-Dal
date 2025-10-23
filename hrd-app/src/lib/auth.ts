import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/hash";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  // In production, NEXTAUTH_SECRET must be set in env.
  // In dev, fall back to a static secret to simplify local runs.
  secret: process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV !== "production" ? "dev-secret" : undefined),
  debug: process.env.NODE_ENV !== "production",
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        emailOrPhone: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials) return null;
          const { emailOrPhone, password } = credentials as Record<string, string>;
          if (!emailOrPhone || !password) return null;

          const identifierRaw = String(emailOrPhone).trim();
          const emailLower = identifierRaw.toLowerCase();
          const phoneDigits = identifierRaw.replace(/\D+/g, "");

          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: emailLower },
                ...(phoneDigits ? [{ phone: phoneDigits }] as const : []),
              ],
            },
          });
          if (!user) return null;

          const ok = await verifyPassword(password, user.passwordHash);
          if (!ok) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.photoUrl,
            role: user.role,
          } as any;
        } catch (err) {
          if (process.env.NODE_ENV !== "production") {
            console.error("NextAuth authorize error:", err);
          }
          // Returning null yields 401 instead of crashing the handler
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist id and role into the token
      if (user) {
        token.sub = (user as any).id || token.sub;
        (token as any).role = (user as any).role || (token as any).role || "MEMBER";
      } else if (token?.sub) {
        // Ensure role is present even on subsequent requests
        if (!(token as any).role) {
          const dbUser = await prisma.user.findUnique({ where: { id: token.sub } });
          (token as any).role = dbUser?.role || "MEMBER";
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Expose id and role on session
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = (token as any).role || "MEMBER";
      }
      return session;
    },
  },
};
