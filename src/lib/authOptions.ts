// src/lib/authOptions.ts
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcrypt";

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt"
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        await dbConnect();
        const user = await User.findOne({ email: credentials?.email }).exec();
        if (!user) {
          throw new Error("No user found with that email");
        }
        const isValid = await bcrypt.compare(credentials!.password, user.hashedPassword);
        if (!isValid) {
          throw new Error("Invalid password");
        }
        // Include membershipTier from the user document if it exists
        return {
          id: user._id.toString(),
          name: user.username,
          email: user.email,
          membershipTier: user.membershipTier // Ensure user model has this field
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.sub ?? '';
        // Add membershipTier to session if it exists in token
        if (typeof token.membershipTier === 'string') {
          session.user.membershipTier = token.membershipTier;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        // Store membershipTier in the token
        if ((user as any).membershipTier) {
          token.membershipTier = (user as any).membershipTier;
        }
      }
      return token;
    }
  }
};
