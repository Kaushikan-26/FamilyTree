/**
 * Relationship types and their semantics.
 *
 * The UI offers specific, often gendered labels (father, grandmother, …) but
 * the inference engine and duplicate detection only care about the underlying
 * *category*. This module is the single source of truth for both.
 */

// Selectable types (order is used for the dropdowns)
export const RELATIONSHIP_TYPES = [
  "father",
  "mother",
  "son",
  "daughter",
  "brother",
  "sister",
  "grandfather",
  "grandmother",
  "spouse",
  "cousin",
  // generic fallbacks (kept for flexibility / backward compatibility)
  "parent",
  "child",
  "sibling",
];

const ANCESTOR = new Set(["father", "mother", "parent"]);
const DESCENDANT = new Set(["son", "daughter", "child"]);
const GRANDPARENT = new Set(["grandfather", "grandmother"]);
const SIBLING = new Set(["brother", "sister", "sibling"]);
const SPOUSE = new Set(["spouse"]);
const COUSIN = new Set(["cousin"]);

/** Map a specific type to its semantic category. */
export function categoryOf(type) {
  if (ANCESTOR.has(type)) return "parent"; // from is parent of to
  if (DESCENDANT.has(type)) return "child"; // from is child of to
  if (GRANDPARENT.has(type)) return "grandparent"; // from is grandparent of to
  if (SIBLING.has(type)) return "sibling";
  if (SPOUSE.has(type)) return "spouse";
  if (COUSIN.has(type)) return "cousin";
  return "other";
}

/**
 * A direction/category-aware canonical key for a relationship.
 * Two relationships with the same key represent the same real-world link
 * (e.g. "A is father of B" and "B is son of A" → identical key), so this is
 * used to reject duplicates regardless of how they were phrased.
 */
export function canonicalKey(from, to, type) {
  const f = String(from);
  const t = String(to);
  const sorted = [f, t].sort().join("-");
  switch (categoryOf(type)) {
    case "parent":
      return `lineal:${f}>${t}`; // f is parent of t
    case "child":
      return `lineal:${t}>${f}`; // t is parent of f
    case "grandparent":
      return `lineal2:${f}>${t}`;
    case "sibling":
      return `sibling:${sorted}`;
    case "spouse":
      return `spouse:${sorted}`;
    case "cousin":
      return `cousin:${sorted}`;
    default:
      return `${type}:${f}>${t}`;
  }
}
