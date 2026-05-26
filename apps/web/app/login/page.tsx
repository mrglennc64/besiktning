"use client";

import Link from "next/link";
import { useState } from "react";

import { SiteFooter, SiteHeader } from "@/app/components/SiteShell";
import { API_URL } from "@/lib/api";

type State =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "sent-magic" }
  | { status: "password-success" }
  | { status: "error"; message: string };

export default function LoginPage() {
  const [state, setState] = useState<State>({ status: "idle" });
  const [mode, setMode] = useState<"magic" | "password">("magic");

  async function requestMagicLink(formData: FormData) {
    const email = String(formData.get("email") ?? "").trim();
    if (!email) {
      setState({ status: "error", message: "Ange din e-postadress." });
      return;
    }
    setState({ status: "sending" });
    try {
      const res = await fetch(`${API_URL}/auth/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok && res.status !== 204) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }
      setState({ status: "sent-magic" });
    } catch (e) {
      setState({
        status: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  async function loginWithPassword(formData: FormData) {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    if (!email || !password) {
      setState({ status: "error", message: "Fyll i både e-post och lösenord." });
      return;
    }
    setState({ status: "sending" });
    try {
      const res = await fetch(`${API_URL}/auth/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        session_token: string;
        expires_at: string;
        is_admin: boolean;
      };
      // Hand off to a server route that sets the httpOnly cookie + redirects.
      const params = new URLSearchParams({
        token: data.session_token,
        expires: data.expires_at,
        admin: data.is_admin ? "1" : "0",
      });
      window.location.href = `/auth/session?${params.toString()}`;
    } catch (e) {
      setState({
        status: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return (
    <main className="flex-1">
      <SiteHeader />
      <section className="mx-auto max-w-md px-6 py-20">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-amber-700">
          Logga in
        </p>
        <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight">
          {mode === "magic"
            ? "Skicka en magic-link till min e-post."
            : "Logga in med lösenord."}
        </h1>
        <p className="mt-3 text-stone-600">
          {mode === "magic"
            ? "Vi mejlar en länk som loggar in dig. Inga lösenord, ingen registrering."
            : "Direkt-inloggning för administratör. Lösenordet sätts via miljövariabel på servern."}
        </p>

        <div className="mt-6 flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode("magic");
              setState({ status: "idle" });
            }}
            className={`rounded-full px-3 py-1 ${
              mode === "magic"
                ? "bg-stone-900 text-white"
                : "border border-stone-300 text-stone-700"
            }`}
          >
            Magic-link
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("password");
              setState({ status: "idle" });
            }}
            className={`rounded-full px-3 py-1 ${
              mode === "password"
                ? "bg-stone-900 text-white"
                : "border border-stone-300 text-stone-700"
            }`}
          >
            Lösenord (admin)
          </button>
        </div>

        {state.status === "sent-magic" ? (
          <div className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
            <p className="font-semibold">Kolla din inbox.</p>
            <p className="mt-2 text-sm">
              Vi har skickat en länk. Klicka på den för att slutföra
              inloggningen.
            </p>
            <p className="mt-4 text-xs text-emerald-800">
              I utvecklingsläge skrivs länken ut i API-loggen istället
              (SMTP-kopplingen kommer i nästa version).
            </p>
          </div>
        ) : (
          <form
            key={mode}
            action={mode === "magic" ? requestMagicLink : loginWithPassword}
            className="mt-6 space-y-4 rounded-lg border border-stone-200 bg-white p-6"
          >
            <label className="block">
              <span className="block text-sm font-medium text-stone-800">
                E-post
              </span>
              <input
                type="email"
                name="email"
                required
                autoFocus
                placeholder="du@exempel.se"
                className="mt-1.5 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
            </label>
            {mode === "password" && (
              <label className="block">
                <span className="block text-sm font-medium text-stone-800">
                  Lösenord
                </span>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  className="mt-1.5 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                />
              </label>
            )}
            {state.status === "error" && (
              <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                {state.message}
              </div>
            )}
            <button
              type="submit"
              disabled={state.status === "sending"}
              className="w-full rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
            >
              {state.status === "sending"
                ? "Skickar..."
                : mode === "magic"
                ? "Skicka magic-link"
                : "Logga in"}
            </button>
          </form>
        )}

        <p className="mt-6 text-xs text-stone-500">
          Behöver du inte logga in?{" "}
          <Link href="/" className="underline">
            Tillbaka till start
          </Link>
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}
