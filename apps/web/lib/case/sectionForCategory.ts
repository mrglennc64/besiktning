import type { OkularSection } from "./types";

/**
 * Map a catalog `category` string (from noteringar.catalog.json) to one of the
 * eight fixed okulär sections. Matching is case-insensitive and keyword-based
 * (substring), not exact equality, so it tolerates the real catalog's category
 * names (e.g. "GRUNDLÄGGNING BETONGPLATTA ELLER SULOR", "STOMME/YTTERVÄGGAR").
 *
 * First match wins. Unknown / unmatched categories fall back to "grundlaggning".
 * Pure function — no IO.
 */
export function sectionForCategory(category: string): OkularSection {
  const c = (category ?? "").toUpperCase();

  const has = (...needles: string[]) => needles.some((n) => c.includes(n));

  // Order matters: more specific / disambiguating rules first.
  if (has("DRÄN", "MARK")) return "mark_och_dranering";
  if (has("GRUND")) return "grundlaggning";
  if (has("STOMME", "YTTERVÄGG", "BJÄLKLAG")) return "stomme";
  if (has("FASAD", "FÖNSTER", "DÖRR", "ALTAN", "BALKONG")) return "fasad_fonster_dorrar";
  // Wet rooms before "TAK" so a hypothetical "VÅTTAK" never lands in yttertak.
  if (has("VÅT", "BAD", "DUSCH", "WC")) return "vatrum";
  if (c.includes("YTTERTAK") || (c.includes("TAK") && !c.includes("VÅT"))) return "yttertak";
  if (has("VIND")) return "vind";
  if (has("EL", "VENT", "VVS", "INSTALL", "VÄRME")) return "installationer";

  return "grundlaggning";
}
