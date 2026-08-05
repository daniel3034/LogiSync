import type { Role } from "@prisma/client";
import type { NextAuthConfig } from "next-auth";

const devFallbackSecret =
  process.env.NODE_ENV === "development"
    ? "logisync-dev-auth-secret-change-me"
    : undefined;

/**
 * Edge-safe Auth.js configuration.
 *
 * This file must not import Prisma, `pg`, or bcrypt: it is loaded by `proxy.ts`,
 * which runs on every matched request. Providers that need database access live
 * in `auth.ts` instead.
 */
export const authConfig = {
  secret: process.env.AUTH_SECRET || devFallbackSecret,
  pages: {
    signIn: "/login",
  },
  // Credentials sign-in requires JWT sessions (no database adapter involved).
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    // Persist the role on the token at sign-in so later requests can read it
    // from the cookie without touching the database.
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      // `JWT` carries an `unknown` index signature and lives in a transitive
      // package that cannot be augmented, so narrow the claim here.
      session.user.role = token.role as Role;
      return session;
    },
  },
} satisfies NextAuthConfig;
