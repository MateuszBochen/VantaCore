import {useCallback, useMemo, useState} from 'react';
import {ChevronDown, ChevronRight, Trash2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Select} from '@/components/ui/select';
import {Surface} from '@/components/ui/surface';
import Stepper, {type StepperStep} from '@/components/ui/Stepper';
import {MarkdownEditor} from '@/components/MarkdownEditor';
import {GraphEditor} from '@/components/GraphEditor';
import type {GraphEdgeData, GraphNodeData} from '@/components/GraphEditor';
import WorkflowStatusPanel from './WorkflowStatusPanel';
import type {IssueType, Status} from '../../../../../lib/Project/Type/types';

const CARD_STEPS: StepperStep[] = [
  {id: 'template', label: 'New ticket template'},
  {id: 'workflow', label: 'Workflow'},
];

type IssueTypeCardProps = {
  issueType: IssueType;
  // The project-level shared pool (see the Status & Workflow Model
  // sub-project) - this card's own "Add status" only picks from here, it no
  // longer creates statuses inline the way it used to.
  statuses: Status[];
  expanded: boolean;
  onToggleExpand: () => void;
  onChange: (issueType: IssueType) => void;
  onRemove: () => void;
};

const IssueTypeCard = ({issueType, statuses, expanded, onToggleExpand, onChange, onRemove}: IssueTypeCardProps) => {
  const [selectedStatusId, setSelectedStatusId] = useState<string | null>(null);
  const [activeCardStep, setActiveCardStep] = useState<string>('template');

  const statusesById = useMemo(() => new Map(statuses.map((status) => [status.id, status])), [statuses]);

  // Memoized so the GraphEditor only re-derives/re-layouts when the workflow
  // actually changes - not on every re-render of this card (e.g. editing the
  // type's own name/color/estimable flag, or a sibling card expanding).
  const graphNodes: GraphNodeData[] = useMemo(
    () =>
      issueType.workflow.flatMap((entry) => {
        const status = statusesById.get(entry.statusId);
        if (!status) {
          return [];
        }

        return [
          {
            id: status.id,
            label: status.id === issueType.initialStatusId ? `${status.name} ★` : status.name,
            color: status.color,
            // The initial status is where every ticket starts — nothing transitions into it.
            connectableAsTarget: status.id !== issueType.initialStatusId,
            // A "done" status is a terminal state — it can't transition out.
            connectableAsSource: !status.isDone,
          },
        ];
      }),
    [issueType.workflow, issueType.initialStatusId, statusesById],
  );

  const graphEdges: GraphEdgeData[] = useMemo(
    () =>
      issueType.workflow.flatMap((entry) =>
        entry.allowedTransitionIds.map((targetId) => ({
          id: `${entry.statusId}->${targetId}`,
          source: entry.statusId,
          target: targetId,
        })),
      ),
    [issueType.workflow],
  );

  const availableStatuses = useMemo(
    () => statuses.filter((status) => !issueType.workflow.some((entry) => entry.statusId === status.id)),
    [statuses, issueType.workflow],
  );

  // Stable identity, not just a stable memo dependency - re-deriving this
  // inline in the JSX below (`availableStatuses.map(...)`) would hand the
  // underlying base-ui Select a brand-new items array (new array, new
  // objects) on every render even when availableStatuses itself hasn't
  // changed, which was confusing its internal open/highlight state right
  // after a selection (the trigger became unresponsive - "Add existing
  // status..." looked available but wouldn't open) since that's exactly the
  // moment this card re-renders for an unrelated reason (e.g. the workflow
  // status panel mounting).
  const availableStatusOptions = useMemo(
    () => availableStatuses.map((status) => ({value: status.id, label: status.name})),
    [availableStatuses],
  );

  const handleAddToWorkflow = useCallback(
    (statusId: string) => {
      if (!statusId) {
        return;
      }

      onChange({
        ...issueType,
        workflow: [...issueType.workflow, {statusId, allowedTransitionIds: []}],
        initialStatusId: issueType.initialStatusId ?? statusId,
      });
      setSelectedStatusId(statusId);
    },
    [issueType, onChange],
  );

  const handleConnect = useCallback(
    ({source, target}: {source: string; target: string}) => {
      onChange({
        ...issueType,
        workflow: issueType.workflow.map((entry) =>
          entry.statusId === source && !entry.allowedTransitionIds.includes(target)
            ? {...entry, allowedTransitionIds: [...entry.allowedTransitionIds, target]}
            : entry,
        ),
      });
    },
    [issueType, onChange],
  );

  const handleEdgeRemove = useCallback(
    (edgeId: string) => {
      const [source, target] = edgeId.split('->');
      onChange({
        ...issueType,
        workflow: issueType.workflow.map((entry) =>
          entry.statusId === source
            ? {...entry, allowedTransitionIds: entry.allowedTransitionIds.filter((id) => id !== target)}
            : entry,
        ),
      });
    },
    [issueType, onChange],
  );

  // Un-links the status from THIS type's workflow only - the shared status
  // itself (see StatusesSection) is untouched and still usable by other
  // issue types.
  const handleRemoveFromWorkflow = useCallback(
    (id: string) => {
      onChange({
        ...issueType,
        workflow: issueType.workflow
          .filter((entry) => entry.statusId !== id)
          .map((entry) => ({...entry, allowedTransitionIds: entry.allowedTransitionIds.filter((transitionId) => transitionId !== id)})),
        initialStatusId: issueType.initialStatusId === id ? null : issueType.initialStatusId,
      });
      setSelectedStatusId(null);
    },
    [issueType, onChange],
  );

  const handleSetInitial = useCallback(
    (id: string) => {
      onChange({
        ...issueType,
        initialStatusId: id,
        // The new initial status can't be transitioned into — drop any transitions that targeted it.
        workflow: issueType.workflow.map((entry) => ({
          ...entry,
          allowedTransitionIds: entry.allowedTransitionIds.filter((transitionId) => transitionId !== id),
        })),
      });
    },
    [issueType, onChange],
  );

  const selectedStatus = selectedStatusId ? (statusesById.get(selectedStatusId) ?? null) : null;

  return (
    <Surface className="overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <button type="button" onClick={onToggleExpand} className="text-muted-foreground hover:text-foreground">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        <input
          type="color"
          value={issueType.color}
          onChange={(e) => onChange({...issueType, color: e.target.value})}
          className="h-8 w-8 cursor-pointer rounded border border-white/20 bg-transparent p-0"
        />

        <Input
          value={issueType.name}
          onChange={(e) => onChange({...issueType, name: e.target.value})}
          className="max-w-xs"
        />

        <label className="ml-2 flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={issueType.estimable}
            onChange={(e) => onChange({...issueType, estimable: e.target.checked})}
            className="h-4 w-4 rounded border-white/30 bg-transparent accent-cyan-400"
          />
          Estimable
        </label>

        <span className="text-xs text-muted-foreground">
          {issueType.workflow.length} status{issueType.workflow.length === 1 ? '' : 'es'}
        </span>

        <Button
          size="icon"
          variant="ghost"
          onClick={onRemove}
          className="ml-auto h-8 w-8 text-muted-foreground hover:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {expanded && (
        <div className="border-t border-border p-4">
          <Stepper steps={CARD_STEPS} activeId={activeCardStep} onSelect={setActiveCardStep} showNumbers={false} className="mb-4" />

          {activeCardStep === 'template' && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">
                Starting title/description a new ticket of this type opens with - a starting point, not enforced afterwards.
              </p>

              <Input
                // Backend can still answer with null here for issue types
                // that predate this field (nullable column, no historical
                // backfill) despite the frontend type saying `string` -
                // guarded the same way TicketEditor's own consumers of
                // these two fields are.
                value={issueType.titleTemplate ?? ''}
                onChange={(e) => onChange({...issueType, titleTemplate: e.target.value})}
                placeholder="e.g. As a [user], I want [goal], so that [benefit]"
              />

              <MarkdownEditor
                value={issueType.descriptionTemplate ?? ''}
                onChange={(descriptionTemplate) => onChange({...issueType, descriptionTemplate})}
                placeholder="Describe the template…"
                className="h-72"
              />
            </div>
          )}

          {activeCardStep === 'workflow' && (
            <>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Statuses</p>
                <Select
                  // Remounted whenever the workflow's status count changes - a
                  // defensive reset against base-ui Select's internal state
                  // (open/highlighted index) going stale right as its items list
                  // shrinks by exactly the entry that was just picked.
                  key={issueType.workflow.length}
                  className="w-56"
                  value=""
                  onValueChange={handleAddToWorkflow}
                  options={availableStatusOptions}
                  placeholder={
                    statuses.length === 0
                      ? 'Add statuses in the Statuses step first'
                      : availableStatuses.length === 0
                        ? 'All statuses added'
                        : 'Add existing status…'
                  }
                  disabled={availableStatuses.length === 0}
                />
              </div>

              {issueType.workflow.length === 0 ? (
                <p className="text-sm text-muted-foreground">No statuses in this workflow yet — add one to start building it.</p>
              ) : (
                <div className="flex h-[70vh] gap-4">
                  <div className="min-w-0 flex-1">
                    <GraphEditor
                      nodes={graphNodes}
                      edges={graphEdges}
                      selectedNodeId={selectedStatusId}
                      allowSelfLoop
                      allowCycles
                      onNodeSelect={setSelectedStatusId}
                      onConnect={handleConnect}
                      onEdgeRemove={handleEdgeRemove}
                    />
                  </div>

                  {selectedStatus && (
                    <WorkflowStatusPanel
                      status={selectedStatus}
                      isInitial={issueType.initialStatusId === selectedStatus.id}
                      onSetInitial={() => handleSetInitial(selectedStatus.id)}
                      onRemove={() => handleRemoveFromWorkflow(selectedStatus.id)}
                      onClose={() => setSelectedStatusId(null)}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Surface>
  );
};

export default IssueTypeCard;
