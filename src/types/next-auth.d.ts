// src/types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface User extends DefaultUser {
    membershipTier?: string;
  }

  interface Session {
    user?: {
      id: string;
      name: string;
      email: string;
      membershipTier?: string;
    } & DefaultSession["user"];
  }
}
