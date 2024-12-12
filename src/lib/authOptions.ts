// src/lib/authOptions.ts
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcrypt";

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Check that credentials are provided
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Connect to DB
        await dbConnect();

        // Find user by email
        const user = await User.findOne({ email: credentials.email });
        if (!user) {
          return null;
        }

        // Compare passwords
        const isValid = await user.comparePassword(credentials.password);
        if (!isValid) {
          return null;
        }

        // Return user object for session
        return {
          id: user._id.toString(),
          name: user.username,       // Use the username from DB
          email: user.email,
          isAdmin: user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL,
          membershipTier: user.membershipTier || "basic",
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin ?? false;
        token.membershipTier = user.membershipTier ?? "basic";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.membershipTier = token.membershipTier as string;
        // session.user.name is already set to username from user object above
      }
      return session;
    },
  },
};
