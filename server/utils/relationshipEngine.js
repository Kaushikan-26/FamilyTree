/**
 * Relationship Logic Engine
 * -------------------------
 * Builds an in-memory kinship graph from the stored Member + Relationship
 * documents and infers the textual relationship between any two members,
 * including indirect ones (grandparent, uncle, cousin, in-laws, ...).
 *
 * The four stored relationship types are normalized into four maps:
 *   parents[child]   -> Set(parentIds)
 *   children[parent] -> Set(childIds)
 *   spouses[id]      -> Set(spouseIds)
 *   siblings[id]     -> Set(siblingIds)   (explicit sibling links)
 */

import { categoryOf } from "./relationshipTypes.js";

const id = (v) => String(v);

/** Construct the kinship graph used by getRelationship(). */
export function buildGraph(members, relationships) {
  const memberMap = new Map();
  for (const m of members) memberMap.set(id(m._id), m);

  const parents = new Map(); // childId -> Set(parentId)
  const children = new Map(); // parentId -> Set(childId)
  const grand = new Map(); // grandchildId -> Set(grandparentId)
  const spouses = new Map();
  const siblings = new Map();
  const cousins = new Map();

  const add = (map, k, v) => {
    if (!map.has(k)) map.set(k, new Set());
    map.get(k).add(v);
  };

  for (const r of relationships) {
    const from = id(r.fromMemberId);
    const to = id(r.toMemberId);
    // Reduce the specific type (father/mother/...) to its category
    switch (categoryOf(r.relationshipType)) {
      case "parent": // from is parent of to
        add(children, from, to);
        add(parents, to, from);
        break;
      case "child": // from is child of to
        add(parents, from, to);
        add(children, to, from);
        break;
      case "grandparent": // from is grandparent of to (2 generations up)
        add(grand, to, from);
        break;
      case "spouse":
        add(spouses, from, to);
        add(spouses, to, from);
        break;
      case "sibling":
        add(siblings, from, to);
        add(siblings, to, from);
        break;
      case "cousin":
        add(cousins, from, to);
        add(cousins, to, from);
        break;
      default:
        break;
    }
  }

  return { memberMap, parents, children, grand, spouses, siblings, cousins };
}

/** Pick a gendered label based on the member's stored gender. */
function genderTerm(member, male, female, neutral) {
  const g = member?.gender;
  if (g === "male") return male;
  if (g === "female") return female;
  return neutral;
}

/** "great-great-" prefix builder for N extra generations. */
function greatPrefix(extra) {
  return "great-".repeat(Math.max(0, extra));
}

/** Ordinal words for cousin degrees. */
function ordinal(n) {
  const names = ["first", "second", "third", "fourth", "fifth", "sixth"];
  return names[n - 1] || `${n}th`;
}

/**
 * BFS up the parent graph. Returns Map(ancestorId -> minimal generation
 * distance), including the member itself at distance 0.
 */
function ancestorDistances(graph, startId) {
  const dist = new Map([[startId, 0]]);
  const queue = [startId];
  while (queue.length) {
    const cur = queue.shift();
    const d = dist.get(cur);
    // Direct parents are one generation up
    for (const p of graph.parents.get(cur) || []) {
      if (!dist.has(p)) {
        dist.set(p, d + 1);
        queue.push(p);
      }
    }
    // Grandparents recorded directly are two generations up
    for (const gp of graph.grand.get(cur) || []) {
      if (!dist.has(gp)) {
        dist.set(gp, d + 2);
        queue.push(gp);
      }
    }
  }
  return dist;
}

/**
 * Find the closest common ancestor of A and B.
 * Returns { dA, dB } generation distances, or null if unrelated by blood.
 */
function commonAncestor(graph, aId, bId) {
  const aAnc = ancestorDistances(graph, aId);
  const bAnc = ancestorDistances(graph, bId);
  let best = null;
  for (const [anc, dA] of aAnc) {
    if (bAnc.has(anc)) {
      const dB = bAnc.get(anc);
      if (!best || dA + dB < best.dA + best.dB) best = { dA, dB };
    }
  }
  return best;
}

/**
 * Translate generation distances (dA, dB) to a textual label describing
 * B's relationship to A. `b` is B's member doc (for gendered terms).
 */
function labelFromDistances(dA, dB, b) {
  if (dA === 0 && dB === 0) return "self";

  // A is an ancestor of B -> B is a descendant
  if (dA === 0) {
    if (dB === 1) return genderTerm(b, "son", "daughter", "child");
    if (dB === 2) return genderTerm(b, "grandson", "granddaughter", "grandchild");
    return greatPrefix(dB - 2) + genderTerm(b, "grandson", "granddaughter", "grandchild");
  }

  // B is an ancestor of A
  if (dB === 0) {
    if (dA === 1) return genderTerm(b, "father", "mother", "parent");
    if (dA === 2) return genderTerm(b, "grandfather", "grandmother", "grandparent");
    return greatPrefix(dA - 2) + genderTerm(b, "grandfather", "grandmother", "grandparent");
  }

  // Both one generation from common ancestor -> siblings
  if (dA === 1 && dB === 1) return genderTerm(b, "brother", "sister", "sibling");

  // A is a child of the common ancestor, B is further down -> niece/nephew line
  if (dA === 1 && dB >= 2) {
    const base = genderTerm(b, "nephew", "niece", "niece/nephew");
    return dB === 2 ? base : greatPrefix(dB - 2) + "grand-" + base;
  }

  // B is a sibling of an ancestor of A -> uncle/aunt line
  if (dB === 1 && dA >= 2) {
    const base = genderTerm(b, "uncle", "aunt", "uncle/aunt");
    return dA === 2 ? base : greatPrefix(dA - 2) + "grand-" + base;
  }

  // Both at least two generations down -> cousins
  const degree = Math.min(dA, dB) - 1;
  const removed = Math.abs(dA - dB);
  let label = `${ordinal(degree)} cousin`;
  if (removed === 1) label += " once removed";
  else if (removed === 2) label += " twice removed";
  else if (removed > 2) label += ` ${removed} times removed`;
  return label;
}

/**
 * Public API.
 * Returns a human-readable description of how member B relates to member A,
 * e.g. "grandmother", "uncle", "second cousin once removed", "father-in-law".
 *
 * @param {object} graph  result of buildGraph()
 * @param {string} aIdRaw id of member A (the reference point)
 * @param {string} bIdRaw id of member B
 */
export function getRelationship(graph, aIdRaw, bIdRaw) {
  const aId = id(aIdRaw);
  const bId = id(bIdRaw);
  const b = graph.memberMap.get(bId);

  if (!graph.memberMap.has(aId) || !b) return "unknown member";
  if (aId === bId) return "self";

  // 1. Direct spouse
  if ((graph.spouses.get(aId) || new Set()).has(bId)) {
    return genderTerm(b, "husband", "wife", "spouse");
  }

  // 2. Explicit sibling link (covers half/step siblings recorded directly)
  if ((graph.siblings.get(aId) || new Set()).has(bId)) {
    return genderTerm(b, "brother", "sister", "sibling");
  }

  // 3. Blood relationship via closest common ancestor
  const ca = commonAncestor(graph, aId, bId);
  if (ca) return labelFromDistances(ca.dA, ca.dB, b);

  // 3b. Explicit cousin link
  if ((graph.cousins.get(aId) || new Set()).has(bId)) {
    return "cousin";
  }

  // 4. In-law relationships (one marriage hop)
  // B is the spouse of one of A's children -> son/daughter-in-law
  for (const child of graph.children.get(aId) || []) {
    if ((graph.spouses.get(child) || new Set()).has(bId)) {
      return genderTerm(b, "son-in-law", "daughter-in-law", "child-in-law");
    }
  }
  // B is a parent of A's spouse -> father/mother-in-law
  for (const sp of graph.spouses.get(aId) || []) {
    if ((graph.parents.get(sp) || new Set()).has(bId)) {
      return genderTerm(b, "father-in-law", "mother-in-law", "parent-in-law");
    }
  }
  // B is the spouse of A's sibling, or a sibling of A's spouse -> sibling-in-law
  const isSiblingOf = (x, y) => {
    const ancX = ancestorDistances(graph, x);
    const ancY = ancestorDistances(graph, y);
    for (const [anc, dx] of ancX) {
      if (ancY.has(anc) && dx === 1 && ancY.get(anc) === 1) return true;
    }
    return (graph.siblings.get(x) || new Set()).has(y);
  };
  for (const sp of graph.spouses.get(aId) || []) {
    if (isSiblingOf(sp, bId)) {
      return genderTerm(b, "brother-in-law", "sister-in-law", "sibling-in-law");
    }
  }
  for (const sib of graph.siblings.get(aId) || []) {
    if ((graph.spouses.get(sib) || new Set()).has(bId)) {
      return genderTerm(b, "brother-in-law", "sister-in-law", "sibling-in-law");
    }
  }

  // 5. No known relationship
  return "no known relationship";
}
