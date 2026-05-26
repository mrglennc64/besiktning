import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Internal route used by the password-login flow on /login: the client has
 * already exchanged credentials for a session token via /auth/password and
 * passes it here so we can set the httpOnly cookie server-side and redirect.
 * Not linked from anywhere user-facing.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const expires = url.searchParams.get("expires");
  const admin = url.searchParams.get("admin");

  if (!token || !expires) {
    return NextResponse.redirect(new URL("/login?error=missing_token", url));
  }
  const expiresDate = new Date(expires);
  if (isNaN(expiresDate.getTime())) {
    return NextResponse.redirect(new URL("/login?error=bad_expiry", url));
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresDate,
  });

  return NextResponse.redirect(
    new URL(admin === "1" ? "/admin" : "/engine", url),
  );
}
