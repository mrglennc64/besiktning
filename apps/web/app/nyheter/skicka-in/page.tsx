"use client";

import Link from "next/link";
import { useState } from "react";

import { SiteFooter, SiteHeader } from "@/app/components/SiteShell";
import { api } from "@/lib/api";

export default function SkickaInPage() {
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "sending" }
    | { status: "sent" }
    | { status: "error"; message: string }
  >({ status: "idle" });

  async function onSubmit(formData: FormData) {
    setState({ status: "sending" });
    try {
      await api.submitNews({
        title: String(formData.get("title") ?? "").trim(),
        url: String(formData.get("url") ?? "").trim(),
        summary: String(formData.get("summary") ?? "").trim() || undefined,
        submitter_name: String(formData.get("submitter_name") ?? "").trim(),
        submitter_email: String(formData.get("submitter_email") ?? "").trim(),
      });
      setState({ status: "sent" });
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
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-amber-700">
            Skicka in tips
          </p>
          <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Tipsa oss om något läsvärt.
          </h1>
          <p className="mt-4 text-stone-600">
            Branschnyheter, intressanta fall, podcastavsnitt, blogginlägg —
            allt som rör besiktning, fastighet eller bostadsköp. Carina går
            igenom varje bidrag manuellt innan det publiceras under{" "}
            <Link href="/nyheter" className="underline">/nyheter</Link>.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-12">
        {state.status === "sent" ? (
          <ThankYou />
        ) : (
          <form
            action={onSubmit}
            className="space-y-5 rounded-lg border border-stone-200 bg-white p-6"
          >
            <Field
              label="Rubrik på det du tipsar om"
              name="title"
              required
              placeholder="t.ex. Boverkets nya riktlinjer för våtrum 2026"
            />
            <Field
              label="Länk (URL)"
              name="url"
              type="url"
              required
              placeholder="https://..."
            />
            <TextareaField
              label="Kort sammanfattning (valfritt)"
              name="summary"
              placeholder="Beskriv kort vad det handlar om och varför det är värt att läsa."
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Ditt namn"
                name="submitter_name"
                required
                placeholder="Anna Andersson"
              />
              <Field
                label="Din e-post"
                name="submitter_email"
                type="email"
                required
                placeholder="anna@exempel.se"
              />
            </div>
            <p className="text-xs text-stone-500">
              Din e-post används bara om vi behöver återkoppla om tipset. Vi
              publicerar inte den.
            </p>
            {state.status === "error" && (
              <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                Något gick fel: {state.message}
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={state.status === "sending"}
                className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
              >
                {state.status === "sending" ? "Skickar..." : "Skicka in"}
              </button>
              <Link href="/nyheter" className="text-sm text-stone-600 hover:text-stone-900">
                Avbryt
              </Link>
            </div>
          </form>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-stone-800">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
      />
    </label>
  );
}

function TextareaField({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-stone-800">{label}</span>
      <textarea
        name={name}
        rows={4}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
      />
    </label>
  );
}

function ThankYou() {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-8 text-center">
      <h2 className="text-xl font-semibold text-emerald-900">Tack — bidraget är registrerat.</h2>
      <p className="mt-2 text-sm text-emerald-800">
        Carina får en notis och går igenom det inom kort. Om vi väljer att
        publicera dyker det upp på <Link href="/nyheter" className="underline">/nyheter</Link>.
      </p>
      <div className="mt-5 flex justify-center gap-3">
        <Link
          href="/nyheter"
          className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
        >
          Till nyhetsflödet
        </Link>
        <Link
          href="/nyheter/skicka-in"
          className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
        >
          Skicka in ett till
        </Link>
      </div>
    </div>
  );
}
