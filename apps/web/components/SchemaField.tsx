"use client";

import { ChangeEvent } from "react";

export interface FieldDef {
  type?: string | string[];
  title?: string;
  description?: string;
  enum?: (string | number | null)[];
  format?: string;
  minimum?: number;
  maximum?: number;
  maxLength?: number;
  "x-labels"?: Record<string, string>;
}

interface Props {
  name: string;
  def: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
}

function fieldId(name: string) {
  return `f_${name.replace(/\./g, "_")}`;
}

function resolveType(def: FieldDef): string {
  const t = def.type;
  if (Array.isArray(t)) return t.find((x) => x !== "null") ?? "string";
  return t ?? "string";
}

/**
 * Renders a single leaf field from a JSON-schema property.
 * Handles: string (text/date/email), number, integer, boolean, enum.
 * Nested objects are NOT handled here — see SchemaForm for composition.
 */
export function SchemaField({ name, def, value, onChange }: Props) {
  const id = fieldId(name);
  const label = def.title ?? name;
  const type = resolveType(def);

  // Enum: render as <select>
  if (def.enum && def.enum.length > 0) {
    const labels = def["x-labels"] ?? {};
    const v = value === undefined || value === null ? "" : String(value);
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
        <select
          id={id}
          value={v}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") return onChange(null);
            // try to coerce back to the original literal type
            const match = def.enum!.find((x) => String(x) === raw);
            onChange(match ?? raw);
          }}
          className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">— välj —</option>
          {def.enum
            .filter((x) => x !== null)
            .map((opt) => {
              const key = String(opt);
              return (
                <option key={key} value={key}>
                  {labels[key] ?? key}
                </option>
              );
            })}
        </select>
      </div>
    );
  }

  // boolean: checkbox
  if (type === "boolean") {
    return (
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor={id} className="text-sm text-gray-700">
          {label}
        </label>
      </div>
    );
  }

  // number / integer
  if (type === "number" || type === "integer") {
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
        <input
          id={id}
          type="number"
          step={type === "integer" ? 1 : "any"}
          min={def.minimum}
          max={def.maximum}
          value={value === undefined || value === null ? "" : Number(value)}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;
            if (raw === "") return onChange(null);
            const n = type === "integer" ? parseInt(raw, 10) : parseFloat(raw);
            onChange(Number.isNaN(n) ? null : n);
          }}
          className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>
    );
  }

  // string variants: date, email, long text
  const format = def.format;
  const isLongText = (def.maxLength ?? 0) > 200;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      {isLongText ? (
        <textarea
          id={id}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          rows={4}
          className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
        />
      ) : (
        <input
          id={id}
          type={format === "date" ? "date" : format === "email" ? "email" : "text"}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
        />
      )}
      {def.description && <span className="text-xs text-gray-500">{def.description}</span>}
    </div>
  );
}
