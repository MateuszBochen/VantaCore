import {useCallback, useState} from 'react';
import {GraphEditor} from '@/components/GraphEditor';
import type {GraphConnectionRejectReason, GraphEdgeData, GraphNodeData} from '@/components/GraphEditor';
import {toastService} from '@/lib/Toast/ToastService';
import TypePanel from './TypePanel';
import type {IssueType} from '../../../../../lib/Project/Type/types';

type HierarchySectionProps = {
  issueTypes: IssueType[];
  onChange: (issueTypes: IssueType[]) => void;
};

const HierarchySection = ({issueTypes, onChange}: HierarchySectionProps) => {
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);

  const graphNodes: GraphNodeData[] = issueTypes.map((type) => ({
    id: type.id,
    label: type.name,
    color: type.color,
  }));

  const graphEdges: GraphEdgeData[] = issueTypes.flatMap((type) =>
    type.childTypeIds.map((childId) => ({
      id: `${type.id}->${childId}`,
      source: type.id,
      target: childId,
    })),
  );

  const handleConnect = useCallback(
    ({source, target}: {source: string; target: string}) => {
      onChange(
        issueTypes.map((type) =>
          type.id === source && !type.childTypeIds.includes(target)
            ? {...type, childTypeIds: [...type.childTypeIds, target]}
            : type,
        ),
      );
    },
    [issueTypes, onChange],
  );

  const handleEdgeRemove = useCallback(
    (edgeId: string) => {
      const [parentId, childId] = edgeId.split('->');
      onChange(
        issueTypes.map((type) =>
          type.id === parentId
            ? {...type, childTypeIds: type.childTypeIds.filter((id) => id !== childId)}
            : type,
        ),
      );
    },
    [issueTypes, onChange],
  );

  const handleTypeUpdate = useCallback(
    (updated: IssueType) => {
      onChange(issueTypes.map((type) => (type.id === updated.id ? updated : type)));
    },
    [issueTypes, onChange],
  );

  const handleConnectionRejected = useCallback((reason: GraphConnectionRejectReason) => {
    if (reason === 'cycle') {
      toastService.push('error', 'That connection would create a cycle in the hierarchy — not allowed.');
    }
  }, []);

  const selectedType = issueTypes.find((type) => type.id === selectedTypeId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Hierarchy</p>
        <p className="text-xs text-muted-foreground">
          Drag from one type onto another to allow it as a child. Self-loops are fine (e.g. Task → Task
          subtasks); cycles across multiple types are blocked.
        </p>
      </div>

      {issueTypes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Add issue types first to configure their hierarchy.</p>
      ) : (
        <div className="flex h-[60vh] gap-4">
          <div className="min-w-0 flex-1">
            <GraphEditor
              nodes={graphNodes}
              edges={graphEdges}
              selectedNodeId={selectedTypeId}
              allowSelfLoop
              allowCycles={false}
              onNodeSelect={setSelectedTypeId}
              onConnect={handleConnect}
              onEdgeRemove={handleEdgeRemove}
              onConnectionRejected={handleConnectionRejected}
            />
          </div>

          {selectedType && (
            <TypePanel type={selectedType} onChange={handleTypeUpdate} onClose={() => setSelectedTypeId(null)} />
          )}
        </div>
      )}
    </div>
  );
};

export default HierarchySection;
