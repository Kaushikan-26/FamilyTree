import { Handle, Position } from "reactflow";

/**
 * A tiny invisible-ish connector dot where a couple's lines meet before
 * descending to their children. Not draggable or interactive — it only exists
 * so React Flow has an anchor point for the family-tree "marriage junction".
 */
export default function JunctionNode() {
  return (
    <div className="junction-node">
      <Handle id="jt" type="target" position={Position.Top} />
      <Handle id="jb" type="source" position={Position.Bottom} />
    </div>
  );
}
