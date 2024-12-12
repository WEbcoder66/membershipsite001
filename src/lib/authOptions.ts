// src/lib/authOptions.ts
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

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
        // Check that credentials are provided and valid
        if (!credentials || !credentials.email || !credentials.password) {
          return null;
        }

        // Implement your user lookup logic here
        // For demo, we hardcode an admin user:
        if (
          credentials.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL &&
          credentials.password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD
        ) {
          // Admin user example
          return {
            id: "123",
            name: "Admin User",
            email: credentials.email,
            isAdmin: true,
            membershipTier: "allAccess",
          };
        } else {
          // Regular user example
          // In a real app, you'd validate credentials against a database
          // and set isAdmin/membershipTier accordingly.
          return {
            id: "456",
            name: "Regular User",
            email: credentials.email,
            isAdmin: false,
            membershipTier: "basic",
          };
        }
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
      }
      return session;
    },
  },
};
