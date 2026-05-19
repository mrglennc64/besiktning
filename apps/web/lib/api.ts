// Minimal fetch wrapper for the besiktning API.
// Server URL is configurable via NEXT_PUBLIC_API_URL (falls back to localhost dev).

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

export type Template = "apartment" | "smahus" | "house";
export type Status = "draft" | "review" | "final";

export interface Protokoll {
  id: string;
  user_id: string;
  template: Template;
  number: string;
  data: Record<string, unknown>;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface ProtokollSummary {
  id: string;
  template: Template;
  number: string;
  status: Status;
  created_at: string;
  updated_at: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${text || path}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  healthz: () => request<{ status: string; storage: string }>("/healthz"),

  getSchema: (template: Template) =>
    request<Record<string, unknown>>(`/schemas/${template}`),

  listProtokoll: () => request<ProtokollSummary[]>("/protokoll"),

  createProtokoll: (template: Template) =>
    request<Protokoll>("/protokoll", {
      method: "POST",
      body: JSON.stringify({ template }),
    }),

  getProtokoll: (id: string) => request<Protokoll>(`/protokoll/${id}`),

  patchProtokoll: (id: string, data: Record<string, unknown>) =>
    request<Protokoll>(`/protokoll/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ data }),
    }),

  deleteProtokoll: (id: string) =>
    request<void>(`/protokoll/${id}`, { method: "DELETE" }),
};
