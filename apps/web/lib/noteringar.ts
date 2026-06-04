// The catalog is imported statically so it is bundled into the build and traced
// into the serverless function. The committed copy (lib/noteringar.catalog.json)
// is kept in sync with the source of truth (packages/schemas/noteringar.json) by
// scripts/sync-catalog.mjs, run on predev/prebuild. This avoids reading a file
// from outside the app dir at runtime, which doesn't exist on Vercel.
import catalogData from "./noteringar.catalog.json";

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

const catalog = catalogData as unknown as Catalog;

export async function getCatalog(): Promise<Catalog> {
  return catalog;
}

export async function getEntry(id: string): Promise<NoteringEntry | null> {
  return catalog.entries.find((e) => e.id === id) ?? null;
}

export async function getMatchableEntries(categoryFilter?: string): Promise<
  Pick<NoteringEntry, "id" | "category" | "title">[]
> {
  return catalog.entries
    .filter((e) => e.title.length > 0)
    .filter((e) => !categoryFilter || e.category === categoryFilter)
    .map(({ id, category, title }) => ({ id, category, title }));
}
