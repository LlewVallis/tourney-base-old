import { PrismaAdapter } from "@next-auth/prisma-adapter";
import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { rawDb } from "../../../lib/server/db";
import { error } from "../../../lib/util";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId:
        process.env.GOOGLE_CLIENT_ID ?? error("GOOGLE_CLIENT_ID was not set"),
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET ??
        error("GOOGLE_CLIENT_SECRET was not set"),
    }),
  ],
  adapter: PrismaAdapter(rawDb),
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    error: "/auth-error",
  },
  callbacks: {
    async session({ session, user }) {
      session.userId = user.id;
      return session;
    },
  },
};

export default NextAuth(authOptions);
