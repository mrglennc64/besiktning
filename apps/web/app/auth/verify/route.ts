import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { API_URL } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

interface ExchangeResponse {
  email: string;
  session_token: string;
  expires_at: string;
  is_admin: boolean;
}

/**
 * Magic-link landing. Takes ?token=, exchanges with the API for a session,
 * sets the httpOnly cookie, redirects into the app.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing_token", url));
  }

  let exchange: ExchangeResponse;
  try {
    const res = await fetch(`${API_URL}/auth/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      cache: "no-store",
    });
    if (!res.ok) {
      const detail = encodeURIComponent(await res.text().catch(() => ""));
      return NextResponse.redirect(
        new URL(`/login?error=exchange_failed&detail=${detail}`, url),
      );
    }
    exchange = (await res.json()) as ExchangeResponse;
  } catch (e) {
    const detail = encodeURIComponent(e instanceof Error ? e.message : String(e));
    return NextResponse.redirect(
      new URL(`/login?error=api_unreachable&detail=${detail}`, url),
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, exchange.session_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(exchange.expires_at),
  });

  return NextResponse.redirect(
    new URL(exchange.is_admin ? "/admin" : "/engine", url),
  );
}
