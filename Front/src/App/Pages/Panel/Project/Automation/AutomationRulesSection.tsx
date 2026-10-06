import {useCallback} from 'react';
import {Select} from '@/components/ui/select';
import {Surface} from '@/components/ui/surface';
import type {AutomationRule, IssueType, Status} from '../../../../../lib/Project/Type/types';

type AutomationRulesSectionProps = {
  issueTypes: IssueType[];
  statuses: Status[];
  automationRules: AutomationRule[];
  onChange: (automationRules: AutomationRule[]) => void;
};

// Statuses are project-level now (see the Status & Workflow Model sub-
// project) - an issue type only owns a `workflow` referencing shared ids,
// so resolving "this type's own statuses" needs the shared pool too.
const resolveWorkflowStatuses = (issueType: IssueType, statuses: Status[]): Status[] =>
  issueType.workflow
    .map((entry) => statuses.find((status) => status.id === entry.statusId))
    .filter((status): status is Status => !!status);

const AutomationRulesSection = ({issueTypes, statuses, automationRules, onChange}: AutomationRulesSectionProps) => {
  // Cascade rules only make sense once a type actually has children to wait on.
  const parentTypes = issueTypes.filter((type) => type.childTypeIds.length > 0);

  const handleToggle = useCallback(
    (parentType: IssueType, enabled: boolean) => {
      if (!enabled) {
        onChange(automationRules.filter((rule) => rule.parentTypeId !== parentType.id));
        return;
      }

      const workflowStatuses = resolveWorkflowStatuses(parentType, statuses);
      const defaultStatus = workflowStatuses.find((status) => status.isDone) ?? workflowStatuses[0];
      if (!defaultStatus) {
        return;
      }

      onChange([
        ...automationRules,
        {id: crypto.randomUUID(), parentTypeId: parentType.id, setParentStatusId: defaultStatus.id},
      ]);
    },
    [automationRules, onChange, statuses],
  );

  const handleStatusChange = useCallback(
    (parentType: IssueType, statusId: string) => {
      onChange(
        automationRules.map((rule) =>
          rule.parentTypeId === parentType.id ? {...rule, setParentStatusId: statusId} : rule,
        ),
      );
    },
    [automationRules, onChange],
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Automation rules</p>
        <p className="text-xs text-muted-foreground">
          When every child ticket (across all of a type's child types) reaches a "done" status, automatically set
          the parent ticket's status.
        </p>
      </div>

      {parentTypes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Add hierarchy edges between issue types first — cascade rules become available once a type has at least
          one child type.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {parentTypes.map((parentType) => {
            const rule = automationRules.find((r) => r.parentTypeId === parentType.id) ?? null;
            const workflowStatuses = resolveWorkflowStatuses(parentType, statuses);
            const canEnable = workflowStatuses.length > 0;

            return (
              <Surface key={parentType.id} className="flex flex-wrap items-center gap-3 p-4">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{backgroundColor: parentType.color}} />
                <span className="font-medium text-foreground">{parentType.name}</span>

                <label className="ml-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={rule !== null}
                    disabled={!canEnable}
                    onChange={(e) => handleToggle(parentType, e.target.checked)}
                    className="h-4 w-4 rounded border-white/30 bg-transparent accent-cyan-400"
                  />
                  Auto-set status when all children are done
                </label>

                {rule && (
                  <Select
                    value={rule.setParentStatusId}
                    onValueChange={(value) => handleStatusChange(parentType, value)}
                    className="ml-auto w-fit"
                    options={workflowStatuses.map((status) => ({value: status.id, label: status.name}))}
                  />
                )}

                {!canEnable && <span className="text-xs text-muted-foreground">Add statuses to this type's workflow first.</span>}
              </Surface>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AutomationRulesSection;
