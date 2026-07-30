import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

// Edge-safe instance: cookie/JWT only, no database access. Per the Next.js
// authentication guide, this is an *optimistic* check used to pre-filter
// unauthorized users. The real guard lives next to the data, in
// `app/lib/auth-guard.ts`.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const session = req.auth;

  if (!session?.user) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Page routes only. API routes answer with JSON status codes from their own
  // guard rather than being redirected to an HTML login page.
  matcher: ["/drivers/:path*"],
};
