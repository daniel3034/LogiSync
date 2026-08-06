import type { Role } from "@prisma/client";
import type { NextAuthConfig } from "next-auth";

// Shared by `proxy.ts` and `auth.ts`, so one check covers every runtime.
// `NEXT_PHASE` exemption keeps `pnpm build` working on hosts that inject
// secrets only at runtime.
if (
  !process.env.AUTH_SECRET &&
  process.env.NEXT_PHASE !== "phase-production-build"
) {
  throw new Error(
    "AUTH_SECRET is not set. Run `npx auth secret`, or `pnpm dev` to generate one into .env.local. See README.md."
  );
}

/**
 * Shared Auth.js configuration.
 *
 * This file must not import Prisma, `pg`, or bcrypt: it is loaded by `proxy.ts`,
 * which runs on every matched request. Providers that need database access live
 * in `auth.ts` instead.
 */
export const authConfig = {
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
