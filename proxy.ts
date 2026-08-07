import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

// Cookie/JWT only, no database access. Per the Next.js authentication guide,
// this is an *optimistic* check used to pre-filter unauthorized users. The
// real guard lives next to the data, in `lib/auth-guard.ts`.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const session = req.auth;
  const { pathname } = req.nextUrl;

  if (!session?.user) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // DRIVER may reach /dashboard; everywhere else in the matcher is ADMIN-only.
  if (pathname !== "/dashboard" && session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Page routes only. API routes answer with JSON status codes from their own
  // guard rather than being redirected to an HTML login page. /verify and
  // /login stay off the list on purpose.
  matcher: [
    "/dashboard/:path*",
    "/drivers/:path*",
    "/waybill/:path*",
    "/calculator/:path*",
    "/routes/:path*",
    "/admin/:path*",
  ],
};
