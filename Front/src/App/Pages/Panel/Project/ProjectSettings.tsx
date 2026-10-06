import {useCallback, useMemo, useRef, useState} from 'react';
import {Check} from 'lucide-react';
import {PageContainer} from '@/components/ui/page-container';
import {useNavigate, useSearchParams} from 'react-router-dom';
import useProjectFromRoute from './useProjectFromRoute';
import createDraftProject from './createDraftProject';
import useSaveProjectHook from '../../../../lib/Project/useSaveProjectHook';
import StatusesSection from './Statuses/StatusesSection';
import IssueTypesSection from './IssueTypes/IssueTypesSection';
import HierarchySection from './Hierarchy/HierarchySection';
import AutomationRulesSection from './Automation/AutomationRulesSection';
import AutomationEngineSection from './AutomationRules/AutomationEngineSection';
import FlagsSection from './Flags/FlagsSection';
import CustomFieldsSection from './CustomFields/CustomFieldsSection';
import ImportExportSection from './ImportExport/ImportExportSection';
import VcsIntegrationSection from './Vcs/VcsIntegrationSection';
import WebhooksSection from './Webhooks/WebhooksSection';
import BasicsForm from '../../../Form/ProjectForm/BasicsForm';
import type {BasicsFormData, BasicsFormRef} from '../../../Form/ProjectForm/types';
import Stepper from '../../../../components/ui/Stepper';
import {Button} from '../../../../components/ui/button';
import {useSetModuleTitle} from '../ModuleTitle';
import {PROJECT_SETTINGS_STEPS, projectSettingsStepIdFromParam, projectSettingsStepIdToParam} from './projectSettingsSteps';
import type {ProjectSettingsStepId as StepId} from './projectSettingsSteps';
import type {AutomationRule, CustomFieldDefinition, Flag, IssueType, Project, Status} from '../../../../lib/Project/Type/types';

const STEPS = PROJECT_SETTINGS_STEPS;
const stepIdToParam = projectSettingsStepIdToParam;
const stepIdFromParam = projectSettingsStepIdFromParam;

// Drop rules left pointing at a type (or a status no longer in that type's
// workflow) that no longer exists, so hierarchy/issue-type edits can't
// silently leave automationRules dangling.
const withValidAutomationRules = (issueTypes: IssueType[], rules: AutomationRule[]): AutomationRule[] =>
  rules.filter((rule) => {
    const parentType = issueTypes.find((type) => type.id === rule.parentTypeId);
    return parentType != null && parentType.workflow.some((entry) => entry.statusId === rule.setParentStatusId);
  });

type ProjectSettingsProps = {
  // /projects/new: no project exists yet, so the draft starts purely local
  // and nothing is sent to the API until the user submits a step.
  isNew?: boolean;
};

const ProjectSettings = ({isNew = false}: ProjectSettingsProps) => {
  const navigate = useNavigate();
  const {project: loadedProject, state} = useProjectFromRoute();
  const {saveProject} = useSaveProjectHook();
  const [draft, setDraft] = useState<Project | null>(() => (isNew ? createDraftProject() : null));
  const [loadedForId, setLoadedForId] = useState<string | null>(null);
  const [liveName, setLiveName] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [saving, setSaving] = useState(false);
  const basicsFormRef = useRef<BasicsFormRef>(null);
  // The last project state the backend actually confirmed (via load or a
  // successful save) - `draft` diverges from this the moment any section
  // handler edits it, well before Submit is clicked. See persist()'s failure
  // branch for why this exists. Plain state, not a ref: it's written from the
  // same derived-during-render reset blocks below that already call setDraft/
  // setLoadedForId there, and mutating a ref during render isn't allowed.
  const [savedProject, setSavedProject] = useState<Project | null>(null);

  const activeStep = useMemo(() => stepIdFromParam(searchParams.get('step')), [searchParams]);

  useSetModuleTitle(draft ? `${liveName ?? draft.name} - Settings` : null);

  const handleStepSelect = useCallback(
    (id: StepId) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set('step', stepIdToParam(id));
          return next;
        },
        {replace: true},
      );
    },
    [setSearchParams],
  );

  // Derived-during-render reset (not an effect): local edits should survive
  // re-renders, but must be replaced wholesale when the loaded project is
  // actually a different one.
  //
  // isNew gets its own branch (sentinel loadedForId 'new') - .../:projectId/settings
  // and .../new render the same component at the same spot in the tree, so
  // navigating from an existing project's settings to "new project" re-renders
  // instead of remounting, and useProjectFromRoute reports `loadedProject: null`
  // while isNew (no :projectId in the route) - the branch below alone would
  // never fire, leaving the previous project's data on screen instead of a
  // clean draft (same bug reported for SubProjectDocumentationPage).
  if (isNew && loadedForId !== 'new') {
    setLoadedForId('new');
    setDraft(createDraftProject());
    setLiveName(null);
    // Nothing has ever been saved for a brand-new draft - a rejected create
    // has nothing to roll back to, so the user's local edits (e.g. Basics)
    // simply stay put and they can fix whatever the 422 flagged and retry.
    setSavedProject(null);
  }

  if (!isNew && loadedProject && loadedProject.id !== loadedForId) {
    setLoadedForId(loadedProject.id);
    setDraft(loadedProject);
    setLiveName(null);
    setSavedProject(loadedProject);
  }

  const persist = useCallback(
    (project: Project) => {
      setSaving(true);

      saveProject(project, {isNew})
        .then((result) => {
          if (!result.success) {
            // Every section (Statuses, IssueTypes, ...) writes edits straight
            // into `draft` as they happen, not just on submit - across steps,
            // by design, so one Submit can persist several steps' edits at
            // once. A rejected PUT means the backend applied NONE of that
            // batch, so `draft` must roll back to the last state the backend
            // actually confirmed - otherwise e.g. deleting a still-referenced
            // status (rejected 422 invalid-workflow-status) leaves the status
            // and the issue type's workflow entry looking deleted in the UI
            // even though both are still there on the server. isNew has no
            // confirmed baseline to roll back to (nothing's been saved yet),
            // so this only applies once the project actually exists.
            if (!isNew && savedProject) {
              setDraft(savedProject);
            }
            return;
          }

          if (isNew) {
            // The project now exists on the server for the first time - hand
            // off to the real /:projectId/settings route (which drives all
            // further edits).
            navigate(`/projects/${project.id}/settings?step=${searchParams.get('step') ?? '1'}`, {replace: true});
            return;
          }

          setSavedProject(project);
          setDraft(project);
        })
        .finally(() => setSaving(false));
    },
    [isNew, navigate, saveProject, searchParams, savedProject],
  );

  const handleStatusesChange = useCallback((statuses: Status[]) => {
    setDraft((current) => (current ? {...current, statuses} : current));
  }, []);

  const handleIssueTypesChange = useCallback((issueTypes: IssueType[]) => {
    setDraft((current) =>
      current
        ? {...current, issueTypes, automationRules: withValidAutomationRules(issueTypes, current.automationRules)}
        : current,
    );
  }, []);

  const handleAutomationRulesChange = useCallback((automationRules: AutomationRule[]) => {
    setDraft((current) => (current ? {...current, automationRules} : current));
  }, []);

  const handleFlagsChange = useCallback((flags: Flag[]) => {
    setDraft((current) => (current ? {...current, flags} : current));
  }, []);

  const handleCustomFieldDefinitionsChange = useCallback((customFieldDefinitions: CustomFieldDefinition[]) => {
    setDraft((current) => (current ? {...current, customFieldDefinitions} : current));
  }, []);

  // Every other step writes its edits into `draft` as they happen; Basics
  // must too, or switching steps unmounts BasicsForm (only rendered while
  // active) and its typed-but-never-persisted values are lost - reappearing
  // as "reset to defaults" on the way back, and as the still-default
  // name/prefix getting submitted if the user hits Submit from another step.
  const handleBasicsValuesChange = useCallback((values: BasicsFormData) => {
    setLiveName(values.name);
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const startingNumber = Number(values.startingNumber);

      return {
        ...current,
        name: values.name,
        prefix: values.prefix,
        startingNumber: Number.isNaN(startingNumber) ? current.startingNumber : startingNumber,
        estimateUnit: values.estimateUnit,
      };
    });
  }, []);

  const handleBasicsSubmit = useCallback(
    (data: BasicsFormData) => {
      if (!draft) {
        return;
      }

      persist({
        ...draft,
        name: data.name,
        prefix: data.prefix,
        startingNumber: Number(data.startingNumber),
        estimateUnit: data.estimateUnit,
      });
    },
    [draft, persist],
  );

  const handleSubmit = useCallback(() => {
    if (activeStep === 'basics') {
      basicsFormRef.current?.submit();
      return;
    }

    if (draft) {
      persist(draft);
    }
  }, [activeStep, draft, persist]);

  if (!isNew && (state === 'loading' || !draft)) {
    return <div className="p-8 text-sm text-muted-foreground">Loading project…</div>;
  }

  if (!isNew && state === 'error') {
    return <div className="p-8 text-sm text-muted-foreground">Couldn't load this project.</div>;
  }

  if (!draft) {
    return null;
  }

  return (
    <PageContainer>

      <Stepper steps={STEPS} activeId={activeStep} onSelect={(id) => handleStepSelect(id as StepId)} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {activeStep === 'basics' && (
          <div className="max-w-md">
            {/* Keyed on loadedForId (not just conditionally rendered), so
                switching from one project's Settings straight to another's -
                without an intervening unmount, since it's the same Route
                element - still remounts this with a fresh Formik instance
                seeded from the new project's draft, instead of Formik's own
                enableReinitialize diffing initialValues against a moving
                target (every Basics keystroke now also updates draft, see
                handleBasicsValuesChange) and resetForm()-ing on every
                keystroke. */}
            <BasicsForm
              key={loadedForId ?? 'new'}
              ref={basicsFormRef}
              lockForm={saving}
              onSubmit={handleBasicsSubmit}
              onValuesChange={handleBasicsValuesChange}
              initialValues={{
                name: draft.name,
                prefix: draft.prefix,
                startingNumber: String(draft.startingNumber),
                estimateUnit: draft.estimateUnit,
              }}
            />
          </div>
        )}

        {activeStep === 'statuses' && <StatusesSection statuses={draft.statuses} onChange={handleStatusesChange} />}

        {activeStep === 'issueTypes' && (
          <div className="flex flex-col gap-4">
            {draft.issueTypes.length === 0 && (
              <div className="rounded-xl border border-dashed border-amber-400/30 bg-amber-400/5 p-4 text-sm text-amber-200">
                Configure ticket types to get started — this project has no issue types yet.
              </div>
            )}

            <IssueTypesSection issueTypes={draft.issueTypes} statuses={draft.statuses} onChange={handleIssueTypesChange} />
          </div>
        )}

        {activeStep === 'hierarchy' && (
          <HierarchySection issueTypes={draft.issueTypes} onChange={handleIssueTypesChange} />
        )}

        {activeStep === 'automation' && (
          <AutomationRulesSection
            issueTypes={draft.issueTypes}
            statuses={draft.statuses}
            automationRules={draft.automationRules}
            onChange={handleAutomationRulesChange}
          />
        )}

        {activeStep === 'automationRules' &&
          (isNew ? (
            <p className="text-sm text-muted-foreground">Save the project first to configure automation rules.</p>
          ) : (
            <AutomationEngineSection projectId={draft.id} />
          ))}

        {activeStep === 'flags' && <FlagsSection flags={draft.flags} onChange={handleFlagsChange} />}

        {activeStep === 'customFields' && (
          <CustomFieldsSection
            customFieldDefinitions={draft.customFieldDefinitions}
            onChange={handleCustomFieldDefinitionsChange}
          />
        )}

        {activeStep === 'importExport' &&
          (isNew ? (
            <p className="text-sm text-muted-foreground">Save the project first to import or export tickets.</p>
          ) : (
            <ImportExportSection project={draft} />
          ))}

        {activeStep === 'vcsIntegration' &&
          (isNew ? (
            <p className="text-sm text-muted-foreground">Save the project first to connect a repository.</p>
          ) : (
            <VcsIntegrationSection projectId={draft.id} />
          ))}

        {activeStep === 'webhooks' &&
          (isNew ? (
            <p className="text-sm text-muted-foreground">Save the project first to add webhooks.</p>
          ) : (
            <WebhooksSection projectId={draft.id} />
          ))}
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <Button leftIcon={<Check className="h-4 w-4" />} onClick={handleSubmit} loading={saving}>
          Submit
        </Button>
      </div>
    </PageContainer>
  );
};

export default ProjectSettings;
