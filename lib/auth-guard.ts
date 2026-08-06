import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";

/**
 * Page guard: returns the session for an ADMIN, otherwise redirects.
 *
 * This is the authoritative check. `proxy.ts` performs the same test
 * optimistically, but every page that reads driver data must call this so the
 * check happens as close as possible to the data source.
 */
export async function requireAdmin(callbackUrl?: string): Promise<Session> {
  const session = await auth();

  if (!session?.user) {
    const params = callbackUrl
      ? `?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "";
    redirect(`/login${params}`);
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return session;
}

/**
 * Server Action guard: resolves to the session for an ADMIN, or to `null`.
 *
 * Actions can't redirect the way a page does or return a `NextResponse` the way
 * a route handler does, so the caller turns `null` into whatever its own error
 * state looks like. A Server Action is a POST endpoint that anyone can reach
 * directly, so rendering the form behind `requireAdmin` is not a substitute for
 * calling this.
 */
export async function getAdminSession(): Promise<Session | null> {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  return session;
}

/**
 * Route handler guard: resolves to `null` when the caller is an ADMIN, or to the
 * error response the handler should return.
 *
 *     const denied = await requireAdminApi();
 *     if (denied) return denied;
 */
export async function requireAdminApi(): Promise<NextResponse | null> {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}
