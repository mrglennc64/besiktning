import { readFile } from "node:fs/promises";
import path from "node:path";

export interface NoteringEntry {
  id: string;
  category: string;
  title: string;
  body: string;
  confidence: "low" | "medium";
}

interface Catalog {
  entry_count: number;
  entries: NoteringEntry[];
}

let cached: Catalog | null = null;

async function load(): Promise<Catalog> {
  if (cached) return cached;
  const file = path.join(process.cwd(), "..", "..", "packages", "schemas", "noteringar.json");
  const raw = await readFile(file, "utf-8");
  cached = JSON.parse(raw) as Catalog;
  return cached;
}

export async function getCatalog(): Promise<Catalog> {
  return load();
}

export async function getEntry(id: string): Promise<NoteringEntry | null> {
  const cat = await load();
  return cat.entries.find((e) => e.id === id) ?? null;
}

export async function getMatchableEntries(categoryFilter?: string): Promise<
  Pick<NoteringEntry, "id" | "category" | "title">[]
> {
  const cat = await load();
  return cat.entries
    .filter((e) => e.title.length > 0)
    .filter((e) => !categoryFilter || e.category === categoryFilter)
    .map(({ id, category, title }) => ({ id, category, title }));
}
