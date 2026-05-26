"use client";

import Link from "next/link";
import { useState } from "react";

import { api } from "@/lib/api";

export function ApplyForm() {
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "sending" }
    | { status: "sent" }
    | { status: "error"; message: string }
  >({ status: "idle" });

  async function onSubmit(formData: FormData) {
    setState({ status: "sending" });
    try {
      await api.applyForMembership({
        name: String(formData.get("name") ?? "").trim(),
        email: String(formData.get("email") ?? "").trim(),
        foretag: String(formData.get("foretag") ?? "").trim() || undefined,
        region: String(formData.get("region") ?? "").trim() || undefined,
        specialitet: String(formData.get("specialitet") ?? "").trim() || undefined,
        webbplats: String(formData.get("webbplats") ?? "").trim() || undefined,
        motivering: String(formData.get("motivering") ?? "").trim() || undefined,
      });
      setState({ status: "sent" });
    } catch (e) {
      setState({
        status: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  if (state.status === "sent") {
    return (
      <div className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50 p-8 text-center">
        <h3 className="text-xl font-semibold text-emerald-900">
          Tack — ansökan är registrerad.
        </h3>
        <p className="mt-2 text-sm text-emerald-800">
          Carina får en notis och återkommer per e-post inom en vecka.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
          >
            Tillbaka till start
          </Link>
          <Link
            href="/guide"
            className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
          >
            Läs guiden
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      action={onSubmit}
      className="mt-8 space-y-5 rounded-lg border border-stone-200 bg-white p-6"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Namn" name="name" required placeholder="Anna Andersson" />
        <Field
          label="E-post"
          name="email"
          type="email"
          required
          placeholder="anna@exempel.se"
        />
        <Field
          label="Företag"
          name="foretag"
          placeholder="Andersson Besiktning AB"
        />
        <Field label="Region" name="region" placeholder="Stockholm, Uppsala" />
      </div>
      <Field
        label="Specialiteter"
        name="specialitet"
        placeholder="t.ex. Överlåtelse, våtrum, äldre trähus"
      />
      <Field
        label="Webbplats (om du har en)"
        name="webbplats"
        type="url"
        placeholder="https://..."
      />
      <TextareaField
        label="Kort om dig och varför du vill vara med"
        name="motivering"
        placeholder="Vad har du för bakgrund? Vad lockar dig med den här gemenskapen?"
      />
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
          {state.status === "sending" ? "Skickar..." : "Skicka in ansökan"}
        </button>
        <Link href="/om" className="text-sm text-stone-600 hover:text-stone-900">
          Läs mer om plattformen
        </Link>
      </div>
    </form>
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
