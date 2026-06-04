// Copies the canonical noteringar catalog from packages/schemas into the web app
// so it can be bundled (static import) and traced into the serverless function.
// The source of truth stays packages/schemas/noteringar.json; this keeps the
// committed copy fresh. Tolerant: if the source isn't present (e.g. a build
// context without the monorepo root), it keeps the existing committed copy
// rather than failing the build.
import { copyFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url)); // apps/web/scripts
const src = path.resolve(here, "../../../packages/schemas/noteringar.json");
const dest = path.resolve(here, "../lib/noteringar.catalog.json");

try {
  await access(src);
  await copyFile(src, dest);
  console.log(`[sync-catalog] copied ${src} -> ${dest}`);
} catch (e) {
  console.warn(`[sync-catalog] source not found, keeping committed copy (${e.message})`);
}
