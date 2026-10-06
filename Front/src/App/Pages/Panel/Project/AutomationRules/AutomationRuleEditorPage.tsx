import {useCallback, useEffect, useState} from 'react';
import {Check} from 'lucide-react';
import {useNavigate, useParams, useSearchParams} from 'react-router-dom';
import {PageContainer} from '@/components/ui/page-container';
import {Input} from '@/components/ui/input';
import {Checkbox} from '@/components/ui/checkbox';
import {Button} from '@/components/ui/button';
import Stepper, {type StepperStep} from '@/components/ui/Stepper';
import useProjectFromRoute from '../useProjectFromRoute';
import {automationRulesSettingsLink} from '../automationRulesSettingsLink';
import {useSetModuleTitle} from '../../ModuleTitle';
import {toastService} from '@/lib/Toast/ToastService';
import useUsersHook from '@/lib/User/useUsersHook';
import useListAutomationRulesHook from '@/lib/Automation/useListAutomationRulesHook';
import useSaveAutomationRuleHook from '@/lib/Automation/useSaveAutomationRuleHook';
import createDraftAutomationRule from '@/lib/Automation/createDraftAutomationRule';
import TriggerStep from './TriggerStep';
import ConditionsStep from './ConditionsStep';
import ActionsStep from './ActionsStep';
import HistoryStep from './HistoryStep';
import type {AutomationEngineRule} from '@/lib/Automation/Type/types';

type StepId = 'trigger' | 'conditions' | 'actions' | 'history';

const STEPS: StepperStep[] = [
  {id: 'trigger', label: 'Trigger'},
  {id: 'conditions', label: 'Conditions'},
  {id: 'actions', label: 'Actions'},
  {id: 'history', label: 'History'},
];

type AutomationRuleEditorPageProps = {
  // .../automation-rules/new: no rule exists yet, starts as a local draft -
  // same pattern as ProjectSettings/SubProjectDocumentationPage.
  isNew?: boolean;
};

// There's no single-rule GET endpoint (see the Automation Engine sub-
// project's Solution Design - only list/upsert/delete) so editing an
// existing rule re-fetches the whole list and finds this one by id, same as
// how MyTicketsPage-style consumers work with list-only data.
const AutomationRuleEditorPage = ({isNew = false}: AutomationRuleEditorPageProps) => {
  const {ruleId} = useParams<{ruleId: string}>();
  const navigate = useNavigate();
  const {project, state: projectState} = useProjectFromRoute();
  const {users} = useUsersHook();
  const {listAutomationRules} = useListAutomationRulesHook();
  const {saveAutomationRule} = useSaveAutomationRuleHook();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rule, setRule] = useState<AutomationEngineRule | null>(null);
  const [ruleForId, setRuleForId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const activeStep = (searchParams.get('step') as StepId | null) ?? 'trigger';

  useSetModuleTitle(project ? `${project.name} - Automation Rules` : null);

  useEffect(() => {
    if (isNew || !project || !ruleId) {
      return;
    }

    let cancelled = false;

    listAutomationRules(project.id).then((result) => {
      if (cancelled) {
        return;
      }

      const found = result.success ? (result.rules.find((candidate) => candidate.id === ruleId) ?? null) : null;
      setRule(found);
      setRuleForId(ruleId);
      setNotFound(!found);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listAutomationRules is a thin useRequestHook wrapper recreated every render
  }, [isNew, project?.id, ruleId]);

  // Derived-during-render reset, same pattern as ProjectSettings/
  // SubProjectDocumentationPage - isNew gets a sentinel ruleForId so
  // navigating from an existing rule to "new rule" (same component instance)
  // doesn't keep showing the previous rule's data.
  if (isNew && project && ruleForId !== 'new') {
    setRuleForId('new');
    setRule(createDraftAutomationRule(project.id));
  }

  const handleStepSelect = useCallback(
    (id: string) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set('step', id);
          return next;
        },
        {replace: true},
      );
    },
    [setSearchParams],
  );

  const handleSubmit = () => {
    if (!project || !rule) {
      return;
    }

    setSaving(true);

    saveAutomationRule(project.id, rule)
      .then((result) => {
        if (result.success) {
          navigate(automationRulesSettingsLink(project.id));
          return;
        }

        toastService.push('error', result.message);
      })
      .finally(() => setSaving(false));
  };

  if (projectState === 'loading' || (!isNew && !notFound && !rule)) {
    return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  }

  if (projectState === 'error' || !project) {
    return <div className="p-8 text-sm text-muted-foreground">Couldn't load this project.</div>;
  }

  if (notFound || !rule) {
    return <div className="p-8 text-sm text-muted-foreground">Rule not found.</div>;
  }

  return (
    <PageContainer>
      <div className="flex items-center gap-3">
        <Input
          className="max-w-sm text-sm font-semibold"
          value={rule.name}
          onChange={(event) => setRule({...rule, name: event.target.value})}
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={rule.enabled} onCheckedChange={(enabled) => setRule({...rule, enabled})} />
          Enabled
        </label>
      </div>

      <Stepper steps={STEPS} activeId={activeStep} onSelect={handleStepSelect} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {activeStep === 'trigger' && (
          <TriggerStep project={project} trigger={rule.trigger} onChange={(trigger) => setRule({...rule, trigger})} />
        )}
        {activeStep === 'conditions' && (
          <ConditionsStep
            project={project}
            users={users}
            conditions={rule.conditions}
            onChange={(conditions) => setRule({...rule, conditions})}
          />
        )}
        {activeStep === 'actions' && (
          <ActionsStep
            project={project}
            users={users}
            actions={rule.actions}
            onChange={(actions) => setRule({...rule, actions})}
          />
        )}
        {activeStep === 'history' &&
          (isNew ? (
            <p className="text-sm text-muted-foreground">Save this rule first to see its execution history.</p>
          ) : (
            <HistoryStep projectId={project.id} ruleId={rule.id} />
          ))}
      </div>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        {/* Only way back to the list now that it lives in Settings rather
            than its own sidebar entry - Submit is the other, but this one
            doesn't have to save anything to leave. */}
        <Button variant="outline" onClick={() => navigate(automationRulesSettingsLink(project.id))}>
          Cancel
        </Button>
        <Button leftIcon={<Check className="h-4 w-4" />} onClick={handleSubmit} loading={saving}>
          Submit
        </Button>
      </div>
    </PageContainer>
  );
};

export default AutomationRuleEditorPage;
