import { useEffect, useCallback, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  ConnectionMode,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import MemberNode from "./MemberNode.jsx";
import JunctionNode from "./JunctionNode.jsx";
import { getLayoutedPositions } from "../utils/layout.js";
import { buildTreeElements } from "../utils/treeElements.js";

// Register the custom node types once (must be a stable reference)
const nodeTypes = { member: MemberNode, junction: JunctionNode };

const toNodes = (members, onEdit) =>
  members.map((m) => ({
    id: m._id,
    type: "member",
    position: m.position || { x: 0, y: 0 },
    data: { member: m, onEdit },
  }));

/**
 * React Flow canvas for the family tree.
 * - Member nodes are draggable; positions persisted via onMoveMember.
 * - Connectors are built as a genealogical tree (marriage junctions) by
 *   buildTreeElements: couples join and a single line descends to children.
 * - "Auto Arrange" lays members out top-down by generation.
 */
export default function FamilyGraph({
  members,
  relationships,
  onEditMember,
  onConnectMembers,
  onMoveMember,
  onDeleteRelationship,
  onSelectRelationship,
  onAddRelative,
  onAutoLayout,
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();
  const didAutoLayout = useRef(false);

  // Rebuild member nodes + junction nodes + tree edges whenever the data
  // (including member positions) changes.
  useEffect(() => {
    const { junctionNodes, edges: treeEdges } = buildTreeElements(
      members,
      relationships
    );
    setNodes([...toNodes(members, onEditMember), ...junctionNodes]);
    setEdges(treeEdges);
  }, [members, relationships, onEditMember, setNodes, setEdges]);

  // Recompute the hierarchy, reposition member nodes, persist, refit the view
  const applyLayout = useCallback(() => {
    if (!members.length) return;
    const positions = getLayoutedPositions(members, relationships);
    setNodes((nds) =>
      nds.map((n) =>
        n.type === "member" && positions[n.id]
          ? { ...n, position: positions[n.id] }
          : n
      )
    );
    onAutoLayout(positions); // save to backend (junctions follow on rebuild)
    window.requestAnimationFrame(() => fitView({ padding: 0.2, duration: 300 }));
  }, [members, relationships, setNodes, onAutoLayout, fitView]);

  // On first load, if nobody has a saved position yet, arrange automatically
  useEffect(() => {
    if (didAutoLayout.current || !members.length) return;
    const unpositioned = members.every(
      (m) => !m.position || (m.position.x === 0 && m.position.y === 0)
    );
    if (unpositioned) {
      didAutoLayout.current = true;
      applyLayout();
    }
  }, [members, applyLayout]);

  const handleConnect = useCallback(
    (conn) => {
      if (conn.source && conn.target && conn.source !== conn.target) {
        onConnectMembers(conn.source, conn.target);
      }
    },
    [onConnectMembers]
  );

  const handleNodeDragStop = useCallback(
    (_evt, node) => onMoveMember(node.id, node.position),
    [onMoveMember]
  );

  const handleEdgesDelete = useCallback(
    (deleted) => deleted.forEach((e) => onDeleteRelationship(e.id)),
    [onDeleteRelationship]
  );

  // Clicking an edge opens the edit/delete relationship modal
  const handleEdgeClick = useCallback(
    (_evt, edge) => onSelectRelationship(edge.id),
    [onSelectRelationship]
  );

  // Right-clicking a member node opens "Add a relative" (auto-connected)
  const handleNodeContextMenu = useCallback(
    (evt, node) => {
      evt.preventDefault(); // suppress the browser context menu
      if (node.type === "member") onAddRelative(node.id);
    },
    [onAddRelative]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={handleConnect}
      onNodeDragStop={handleNodeDragStop}
      onEdgesDelete={handleEdgesDelete}
      onEdgeClick={handleEdgeClick}
      onNodeContextMenu={handleNodeContextMenu}
      nodeTypes={nodeTypes}
      defaultEdgeOptions={{ type: "smoothstep" }}
      // Loose mode = start a connection from ANY handle (top or bottom).
      // Large connectionRadius = releasing the drag anywhere near another
      // card snaps to its nearest handle, so you just "touch" the target.
      connectionMode={ConnectionMode.Loose}
      connectionRadius={160}
      fitView
      proOptions={{ hideAttribution: true }}
    >
      <Panel position="top-right">
        <button className="layout-btn" onClick={applyLayout}>
          ⤵ Auto Arrange
        </button>
      </Panel>
      <Panel position="top-left">
        <div className="graph-hint">💡 Right-click a card to add a relative</div>
      </Panel>
      <Background gap={16} color="#e2e8f0" />
      {/* pointer-events disabled so the minimap never blocks dropping a
          connection onto a node that happens to sit beneath it */}
      <MiniMap style={{ pointerEvents: "none" }} />
      <Controls />
    </ReactFlow>
  );
}
