import { MarkerType } from "reactflow";

// Approximate rendered card size (keep in sync with .member-node CSS)
const NODE_W = 188;
const NODE_H = 200;

const EDGE_STROKE = "#111827";

const PARENT_LIKE = new Set(["father", "mother", "parent"]);
const CHILD_LIKE = new Set(["son", "daughter", "child"]);
const GRANDPARENT = new Set(["grandfather", "grandmother"]);
const SPOUSE = new Set(["spouse"]);
const PEER = new Set(["brother", "sister", "sibling", "cousin"]);

const cx = (m) => (m.position?.x || 0) + NODE_W / 2; // card center x
const topY = (m) => m.position?.y || 0;

// Base style applied to every connector so they all look identical (black)
const baseStyle = { stroke: EDGE_STROKE, strokeWidth: 2, cursor: "pointer" };
const labelProps = {
  labelStyle: { fill: "#111827", fontSize: 11, fontWeight: 600, cursor: "pointer" },
  labelBgStyle: { fill: "#fff", fillOpacity: 0.9 },
  labelBgPadding: [6, 3],
  labelBgBorderRadius: 6,
};
const arrow = { type: MarkerType.ArrowClosed, color: EDGE_STROKE };

/**
 * Transforms members + relationships into React Flow elements laid out like a
 * genealogical tree:
 *   - Spouses are joined by a horizontal marriage line.
 *   - When a couple shares children, both parents drop into a single junction
 *     dot, and ONE set of lines descends from that junction to the children
 *     (the classic "family tree" look) — instead of separate diagonal lines
 *     from each parent to each child.
 *   - Children of a single parent (or non-couple parents) use direct lines.
 *   - Sibling/cousin links are plain horizontal lines.
 *
 * Returns { junctionNodes, edges }.
 */
export function buildTreeElements(members, relationships) {
  const byId = new Map(members.map((m) => [String(m._id), m]));

  // child -> Set(parent), and a list of normalized parent→child links
  const parentsOf = new Map();
  const childrenOf = new Map();
  const pcLinks = []; // { relId, parent, child, label, gen }
  const spousePairs = []; // { relId, a, b }
  const peerLinks = []; // { relId, a, b, label }

  const addPC = (relId, parent, child, label, gen = 1) => {
    if (!byId.has(parent) || !byId.has(child)) return;
    pcLinks.push({ relId, parent, child, label, gen });
    if (!parentsOf.has(child)) parentsOf.set(child, new Set());
    parentsOf.get(child).add(parent);
    if (!childrenOf.has(parent)) childrenOf.set(parent, new Set());
    childrenOf.get(parent).add(child);
  };

  relationships.forEach((r) => {
    const f = String(r.fromMemberId);
    const t = String(r.toMemberId);
    const ty = r.relationshipType;
    if (!byId.has(f) || !byId.has(t)) return;
    if (PARENT_LIKE.has(ty)) addPC(r._id, f, t, ty, 1);
    else if (CHILD_LIKE.has(ty)) addPC(r._id, t, f, ty, 1);
    else if (GRANDPARENT.has(ty)) addPC(r._id, f, t, ty, 2);
    else if (SPOUSE.has(ty)) spousePairs.push({ relId: r._id, a: f, b: t });
    else if (PEER.has(ty)) peerLinks.push({ relId: r._id, a: f, b: t, label: ty });
  });

  const junctionNodes = [];
  const edges = [];
  const coveredChildLinks = new Set(); // `${parent}->${child}` routed via a junction

  // ---- Marriage lines + junctions for couples that share children ----
  spousePairs.forEach(({ relId, a, b }) => {
    const ma = byId.get(a);
    const mb = byId.get(b);
    if (!ma || !mb) return;

    // Horizontal marriage line (left card's right handle → right card's left)
    const leftIsA = cx(ma) <= cx(mb);
    const src = leftIsA ? a : b;
    const tgt = leftIsA ? b : a;
    edges.push({
      id: relId,
      source: src,
      target: tgt,
      sourceHandle: "right",
      targetHandle: "left",
      type: "smoothstep",
      label: "spouse",
      ...labelProps,
      style: baseStyle,
    });

    // Children shared by BOTH spouses → route through a single junction
    const shared = [...(childrenOf.get(a) || [])].filter((c) =>
      (parentsOf.get(c) || new Set()).has(b)
    );
    if (!shared.length) return;

    const jid = `jct_${[a, b].sort().join("_")}`;
    const midX = (cx(ma) + cx(mb)) / 2;
    const parentsBottom = Math.max(topY(ma), topY(mb)) + NODE_H;
    const childTop = Math.min(...shared.map((c) => topY(byId.get(c))));
    const jY = parentsBottom + (childTop - parentsBottom) * 0.45;

    junctionNodes.push({
      id: jid,
      type: "junction",
      position: { x: midX - 4, y: jY },
      draggable: false,
      selectable: false,
      data: {},
    });

    // Both parents drop into the junction (no arrowheads)
    [a, b].forEach((p) =>
      edges.push({
        id: `${jid}_in_${p}`,
        source: p,
        target: jid,
        sourceHandle: "bottom",
        targetHandle: "jt",
        type: "smoothstep",
        style: baseStyle,
      })
    );

    // One descent line from the junction to each shared child (arrow → child),
    // labelled "child" so the parent→children link is still clear.
    shared.forEach((c) => {
      edges.push({
        id: `${jid}_out_${c}`,
        source: jid,
        target: c,
        sourceHandle: "jb",
        targetHandle: "top",
        type: "smoothstep",
        label: "child",
        ...labelProps,
        markerEnd: arrow,
        style: baseStyle,
      });
      coveredChildLinks.add(`${a}->${c}`);
      coveredChildLinks.add(`${b}->${c}`);
    });
  });

  // ---- Direct parent→child lines for everything not handled by a junction ----
  pcLinks.forEach(({ relId, parent, child, label }) => {
    if (coveredChildLinks.has(`${parent}->${child}`)) return;
    edges.push({
      id: relId,
      source: parent,
      target: child,
      sourceHandle: "bottom",
      targetHandle: "top",
      type: "smoothstep",
      label,
      ...labelProps,
      markerEnd: arrow,
      style: baseStyle,
    });
  });

  // ---- Sibling / cousin: plain horizontal line, no arrow ----
  peerLinks.forEach(({ relId, a, b, label }) => {
    const ma = byId.get(a);
    const mb = byId.get(b);
    const leftIsA = cx(ma) <= cx(mb);
    edges.push({
      id: relId,
      source: leftIsA ? a : b,
      target: leftIsA ? b : a,
      sourceHandle: "right",
      targetHandle: "left",
      type: "smoothstep",
      label,
      ...labelProps,
      style: baseStyle,
    });
  });

  return { junctionNodes, edges };
}
