import { cookies } from "next/headers";

import { API_URL } from "./api";

export const SESSION_COOKIE = "besiktning_session";

export interface CurrentUser {
  email: string;
  is_admin: boolean;
}

/**
 * Reads the session token cookie and resolves it to a user via the API.
 * Returns null if there's no cookie or it's expired/invalid.
 *
 * Server-side only — uses next/headers `cookies()`.
 */
export async function getSession(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as CurrentUser;
  } catch {
    return null;
  }
}

/**
 * Returns the raw session token from cookies for use as a Bearer header in
 * server-side fetches. Null if there isn't one.
 */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

/**
 * Authenticated server-side fetch. Throws if no session or if the response is
 * not OK. Used by admin pages + server actions.
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = await getSessionToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
