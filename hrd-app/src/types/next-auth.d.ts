import NextAuth from "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      role: "ADMIN" | "MEMBER";
    };
  }

  interface User {
    id: string;
    role: "ADMIN" | "MEMBER";
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;
    role?: "ADMIN" | "MEMBER";
    name?: string | null;
    email?: string | null;
    picture?: string | null;
  }
}
