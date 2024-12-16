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
            membershipTier: user.membershipTier || 'free',
          };
        }

        // If no user in DB and this email matches admin credentials from env:
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
        token.membershipTier = user.membershipTier ?? "free";
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        // Fetch user data from DB to ensure latest membership tier is used
        await dbConnect();
        const dbUser = await User.findById(token.id);
        if (dbUser) {
          session.user = {
            id: dbUser._id.toString(),
            name: dbUser.username,
            email: dbUser.email,
            image: null,
            isAdmin: dbUser.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL,
            membershipTier: dbUser.membershipTier || 'free',
          };
        } else {
          // If user not found, fallback to token values
          session.user = {
            id: token.id as string,
            name: token.name as string,
            // Use optional chaining here to avoid type errors:
            email: session.user?.email ?? '',
            image: token.picture as string | null,
            isAdmin: token.isAdmin as boolean,
            membershipTier: token.membershipTier as string,
          };
        }
      }
      return session;
    },
  },
};
