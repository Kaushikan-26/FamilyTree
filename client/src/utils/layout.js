// Custom genealogical layout.
//
// Produces the structure requested:
//   - generations are stacked in rows (grandparents → parents → children → …)
//   - a grandparent link spans two generations
//   - spouses sit on the SAME row, next to each other
//   - siblings (and cousins) share their row too
//   - each row is centered, and children are ordered under their parents
//
// dagre was dropped here because it cannot force two nodes onto the same rank,
// which is exactly what "spouses on the same line" requires.

export const NODE_W = 200;
export const NODE_H = 210;

const PARENT_LIKE = new Set(["father", "mother", "parent"]);
const CHILD_LIKE = new Set(["son", "daughter", "child"]);
const GRANDPARENT = new Set(["grandfather", "grandmother"]);
const SPOUSE = new Set(["spouse"]);
const PEER = new Set(["brother", "sister", "sibling", "cousin"]); // same generation

export function getLayoutedPositions(members, relationships) {
  const ids = members.map((m) => String(m._id));
  if (!ids.length) return {};
  const idSet = new Set(ids);

  const parents = new Map(); // child -> Set(parent)
  const grand = new Map(); // grandchild -> Set(grandparent)
  const spouses = new Map(); // id -> Set(spouse)
  const peers = new Map(); // id -> Set(sibling/cousin)

  const add = (map, k, v) => {
    if (!map.has(k)) map.set(k, new Set());
    map.get(k).add(v);
  };
  const link = (map, a, b) => {
    add(map, a, b);
    add(map, b, a);
  };

  relationships.forEach((r) => {
    const f = String(r.fromMemberId);
    const t = String(r.toMemberId);
    if (!idSet.has(f) || !idSet.has(t)) return;
    const ty = r.relationshipType;
    if (PARENT_LIKE.has(ty)) add(parents, t, f); // f is parent of t
    else if (CHILD_LIKE.has(ty)) add(parents, f, t); // f is child of t
    else if (GRANDPARENT.has(ty)) add(grand, t, f);
    else if (SPOUSE.has(ty)) link(spouses, f, t);
    else if (PEER.has(ty)) link(peers, f, t);
  });

  // ---- 1. Assign a generation level to every node ----
  // Longest-path from the roots; spouses & peers are equalized to the same
  // level. Iterated to a fixed point (small graphs, so this is cheap).
  const level = new Map();
  ids.forEach((id) => level.set(id, 0));

  for (let iter = 0; iter < ids.length + 3; iter++) {
    let changed = false;
    for (const [c, ps] of parents)
      for (const p of ps)
        if (level.get(c) < level.get(p) + 1) {
          level.set(c, level.get(p) + 1);
          changed = true;
        }
    for (const [c, gs] of grand)
      for (const g of gs)
        if (level.get(c) < level.get(g) + 2) {
          level.set(c, level.get(g) + 2);
          changed = true;
        }
    const equalize = (map) => {
      for (const [a, set] of map)
        for (const b of set) {
          const mx = Math.max(level.get(a), level.get(b));
          if (level.get(a) !== mx) {
            level.set(a, mx);
            changed = true;
          }
          if (level.get(b) !== mx) {
            level.set(b, mx);
            changed = true;
          }
        }
    };
    equalize(spouses);
    equalize(peers);
    if (!changed) break;
  }

  // ---- 2. Union spouses + peers into clusters (kept adjacent per row) ----
  const uf = new Map();
  ids.forEach((id) => uf.set(id, id));
  const find = (x) => {
    while (uf.get(x) !== x) {
      uf.set(x, uf.get(uf.get(x)));
      x = uf.get(x);
    }
    return x;
  };
  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) uf.set(ra, rb);
  };
  const sameLevelUnion = (map) => {
    for (const [a, set] of map)
      for (const b of set) if (level.get(a) === level.get(b)) union(a, b);
  };
  sameLevelUnion(spouses);
  sameLevelUnion(peers);

  // ---- 3. Group into rows by level ----
  const rows = new Map();
  ids.forEach((id) => {
    const L = level.get(id);
    if (!rows.has(L)) rows.set(L, []);
    rows.get(L).push(id);
  });

  const H_GAP = NODE_W + 40;
  const V_GAP = NODE_H + 90;
  const sortedLevels = [...rows.keys()].sort((a, b) => a - b);
  const cx = new Map(); // node center x

  // ---- 4. Place each row, top-down, centering & ordering under parents ----
  sortedLevels.forEach((L) => {
    const row = rows.get(L);

    // Group the row's nodes into their clusters (couples / sibling sets)
    const clusters = new Map();
    row.forEach((id) => {
      const root = find(id);
      if (!clusters.has(root)) clusters.set(root, []);
      clusters.get(root).push(id);
    });

    // Each cluster wants to sit under the average x of its members' parents
    const clusterArr = [...clusters.values()].map((memberIds) => {
      let sum = 0;
      let count = 0;
      memberIds.forEach((id) => {
        for (const p of parents.get(id) || []) {
          if (cx.has(p)) {
            sum += cx.get(p);
            count += 1;
          }
        }
      });
      return { memberIds, desired: count ? sum / count : null };
    });

    // Order clusters left→right by their desired x (parentless ones keep order)
    clusterArr.sort((a, b) => {
      if (a.desired == null && b.desired == null) return 0;
      if (a.desired == null) return 1;
      if (b.desired == null) return -1;
      return a.desired - b.desired;
    });

    // Lay clusters out sequentially, then center the whole row around x = 0
    let cursor = 0;
    const placed = [];
    clusterArr.forEach(({ memberIds }) => {
      memberIds.forEach((id) => {
        cx.set(id, cursor);
        placed.push(id);
        cursor += H_GAP;
      });
      cursor += H_GAP * 0.4; // small gap between separate clusters
    });
    if (placed.length) {
      const mid = (cx.get(placed[0]) + cx.get(placed[placed.length - 1])) / 2;
      placed.forEach((id) => cx.set(id, cx.get(id) - mid));
    }
  });

  // ---- 5. Emit React Flow top-left positions ----
  const positions = {};
  ids.forEach((id) => {
    positions[id] = {
      x: Math.round(cx.get(id) - NODE_W / 2),
      y: Math.round(40 + level.get(id) * V_GAP),
    };
  });
  return positions;
}
