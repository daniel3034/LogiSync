import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: Role;
  }

  interface Session {
    user: {
      role: Role;
    } & DefaultSession["user"];
  }
}

// The `JWT` interface is declared in `@auth/core/jwt`, which is a transitive
// dependency rather than a direct one, so it cannot be augmented from here.
// `auth.config.ts` narrows `token.role` explicitly instead.
