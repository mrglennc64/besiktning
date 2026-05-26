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

export interface NewsItem {
  id: string;
  source_type: "rss" | "member" | "podcast";
  source_name: string;
  title: string;
  url: string;
  summary: string | null;
  published_at: string | null;
  status: "pending" | "published" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface NewsSubmission {
  title: string;
  url: string;
  summary?: string;
  submitter_name: string;
  submitter_email: string;
}

export interface MemberApplicationCreate {
  name: string;
  email: string;
  foretag?: string;
  region?: string;
  specialitet?: string;
  webbplats?: string;
  motivering?: string;
}

export interface MemberApplication extends MemberApplicationCreate {
  id: string;
  status: "pending" | "accepted" | "rejected";
  moderator_note: string | null;
  created_at: string;
  updated_at: string;
}

export const api = {
  healthz: () => request<{ status: string; storage: string }>("/healthz"),

  listNews: (limit = 50) => request<NewsItem[]>(`/news?limit=${limit}`),

  submitNews: (sub: NewsSubmission) =>
    request<NewsItem>("/news/submit", {
      method: "POST",
      body: JSON.stringify(sub),
    }),

  applyForMembership: (app: MemberApplicationCreate) =>
    request<MemberApplication>("/members/apply", {
      method: "POST",
      body: JSON.stringify(app),
    }),

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
