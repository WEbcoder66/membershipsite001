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
      credentials: { email: { label: "Email" }, password: { label: "Password" } },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await dbConnect();
        const user = await User.findOne({ email: credentials.email });

        // If user found in DB, verify password
        if (user) {
          const isValid = await bcrypt.compare(credentials.password, user.hashedPassword);
          if (!isValid) return null;
          return {
            id: user._id.toString(),
            name: user.username,
            email: user.email,
            image: null,
            isAdmin: user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL,
            membershipTier: user.membershipTier || 'basic',
          };
        }

        // If no user in DB and this email matches admin email in env vars,
        // and password matches the admin password from env, allow login.
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
        const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

        if (
          adminEmail &&
          adminPassword &&
          credentials.email === adminEmail &&
          credentials.password === adminPassword
        ) {
          return {
            id: 'admin-env-user',
            name: 'Admin',
            email: adminEmail,
            image: null,
            isAdmin: true,
            membershipTier: 'allAccess',
          };
        }

        // Otherwise, no valid user
        return null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin ?? false;
        token.membershipTier = user.membershipTier ?? "basic";
        token.name = user.name;
        token.picture = user.image; 
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.membershipTier = token.membershipTier as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string | null;
      }
      return session;
    },
  },
};
