export type GraphNodeData = {
  id: string;
  label: string;
  color: string;
  /** Defaults to true. Set false to hide/disable the incoming handle — e.g. a workflow's initial status can't be transitioned into. */
  connectableAsTarget?: boolean;
  /** Defaults to true. Set false to hide/disable the outgoing handle — e.g. a "done" status can't transition out. */
  connectableAsSource?: boolean;
};

export type GraphEdgeData = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

export type GraphConnectionRejectReason = 'self-loop' | 'cycle';

export type GraphEditorProps = {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  selectedNodeId?: string | null;
  /** Hierarchy graph: false (Epic→Story→Task→Epic must be blocked). Workflow graph: true (cycles like In Progress → Reopened → In Progress are normal). */
  allowCycles: boolean;
  /** Both graphs: true (Task→Task subtask, or a status looping to itself is harmless). */
  allowSelfLoop: boolean;
  direction?: 'TB' | 'LR';
  onNodeSelect: (id: string) => void;
  onConnect: (connection: {source: string; target: string}) => void;
  onEdgeRemove?: (edgeId: string) => void;
  onEdgeLabelChange?: (edgeId: string, label: string) => void;
  onConnectionRejected?: (reason: GraphConnectionRejectReason) => void;
  className?: string;
};