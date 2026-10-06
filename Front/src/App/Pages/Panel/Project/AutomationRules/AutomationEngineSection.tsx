import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {Plus, Trash2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Checkbox} from '@/components/ui/checkbox';
import useListAutomationRulesHook from '@/lib/Automation/useListAutomationRulesHook';
import useSaveAutomationRuleHook from '@/lib/Automation/useSaveAutomationRuleHook';
import useDeleteAutomationRuleHook from '@/lib/Automation/useDeleteAutomationRuleHook';
import {TRIGGER_TYPE_LABELS} from './automationLabels';
import type {AutomationEngineRule} from '@/lib/Automation/Type/types';

type AutomationEngineSectionProps = {
  projectId: string;
};

// Embedded as a Settings step (see ProjectSettings.tsx), not its own top-
// level page - unlike the rest of that Stepper's steps though, this one
// doesn't feed the page's single Submit button: each rule is its own
// resource with its own CRUD endpoints (see the Automation Engine sub-
// project's Solution Design), toggled/deleted immediately, not batched into
// the whole-project PUT the way the "Automation" step's parent-status-sync
// rules are.
const AutomationEngineSection = ({projectId}: AutomationEngineSectionProps) => {
  const {listAutomationRules} = useListAutomationRulesHook();
  const {saveAutomationRule} = useSaveAutomationRuleHook();
  const {deleteAutomationRule} = useDeleteAutomationRuleHook();
  const [rules, setRules] = useState<AutomationEngineRule[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    listAutomationRules(projectId).then((result) => {
      if (!cancelled && result.success) {
        setRules(result.rules);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listAutomationRules is a thin useRequestHook wrapper recreated every render
  }, [projectId]);

  const handleToggle = (rule: AutomationEngineRule) => {
    const updated = {...rule, enabled: !rule.enabled};
    setRules((current) => current?.map((candidate) => (candidate.id === rule.id ? updated : candidate)) ?? current);
    saveAutomationRule(projectId, updated);
  };

  const handleDelete = (rule: AutomationEngineRule) => {
    setRules((current) => current?.filter((candidate) => candidate.id !== rule.id) ?? current);
    deleteAutomationRule(projectId, rule.id);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Automation Rules</p>
        <Button asChild size="sm" leftIcon={<Plus className="h-4 w-4" />}>
          <Link to={`/projects/${projectId}/automation-rules/new`}>New rule</Link>
        </Button>
      </div>

      {rules === null ? (
        <p className="text-sm text-muted-foreground">Loading rules…</p>
      ) : rules.length === 0 ? (
        <p className="text-sm text-muted-foreground">No automation rules yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <Checkbox checked={rule.enabled} onCheckedChange={() => handleToggle(rule)} />

              <Link
                to={`/projects/${projectId}/automation-rules/${rule.id}`}
                className="flex min-w-0 flex-1 flex-col gap-0.5 hover:opacity-80"
              >
                <p className="truncate font-medium text-foreground">{rule.name}</p>
                <p className="text-xs text-muted-foreground">
                  {TRIGGER_TYPE_LABELS[rule.trigger.type]}
                  {rule.conditions.length > 0 &&
                    ` · ${rule.conditions.length} condition${rule.conditions.length === 1 ? '' : 's'}`}
                  {' · '}
                  {rule.actions.length} action{rule.actions.length === 1 ? '' : 's'}
                </p>
              </Link>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(rule)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutomationEngineSection;
