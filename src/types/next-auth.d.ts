// src/types/next-auth.d.ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
      name: string;
      email: string;
      membershipTier?: string;
      isAdmin?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    name: string;
    email: string;
    membershipTier?: string;
    isAdmin?: boolean;
  }

  interface JWT {
    id?: string;
    isAdmin?: boolean;
    membershipTier?: string;
  }
}
