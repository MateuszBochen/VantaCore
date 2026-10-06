import {useCallback, useEffect, useState} from 'react';
import {useNavigate, useOutletContext, useParams, useSearchParams} from 'react-router-dom';
import {Check, ChevronLeft, History} from 'lucide-react';
import Stepper, {type StepperStep} from '@/components/ui/Stepper';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {MarkdownEditor} from '@/components/MarkdownEditor';
import {AttachmentsSection, AttachmentMediaPicker} from '@/components/Attachment';
import useGetSubProjectHook from '@/lib/Project/useGetSubProjectHook';
import useGetSubProjectHistoryHook from '@/lib/Project/useGetSubProjectHistoryHook';
import useSaveSubProjectDocumentationHook from '@/lib/Project/useSaveSubProjectDocumentationHook';
import {toastService} from '@/lib/Toast/ToastService';
import createDraftSubProject from './createDraftSubProject';
import AdrSection from './AdrSection';
import type {DocumentationOutletContext} from './DocumentationPage';
import type {SubProject, SubProjectVersion} from '@/lib/Project/Type/types';

const DOC_TYPES: StepperStep[] = [
  {id: 'scope', label: 'Scope'},
  {id: 'impact-analysis', label: 'Impact Analysis'},
  {id: 'solution-design', label: 'Solution Design'},
  {id: 'adr', label: 'ADR'},
  {id: 'attachments', label: 'Attachments'},
];

// No-op: the history viewer reuses the same editable stepper/ADR widgets (no
// separate read-only renderer exists yet) but nothing typed while browsing
// history is ever persisted, since this never reaches setDraft/save.
const ignoreChange = () => {};

type SubProjectDocumentationPageProps = {
  // .../sub-projects/new: no sub-project exists yet, so it starts as a local
  // draft and nothing is sent to the API until the user submits a step.
  isNew?: boolean;
};

// A fetch result tagged with the id it was fetched for, so a route change to
// a different sub-project can be told apart from "still loading this one" -
// same shape as useProjectFromRoute.
type FetchState = {
  id: string;
  subProject: SubProjectVersion | null;
};

const SubProjectDocumentationPage = ({isNew = false}: SubProjectDocumentationPageProps) => {
  const {subProjectId} = useParams<{subProjectId: string}>();
  const navigate = useNavigate();
  const {project} = useOutletContext<DocumentationOutletContext>();
  const {getSubProject} = useGetSubProjectHook();
  const {getSubProjectHistory} = useGetSubProjectHistoryHook();
  const {saveSubProjectDocumentation} = useSaveSubProjectDocumentationHook();
  const [searchParams, setSearchParams] = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [fetched, setFetched] = useState<FetchState | null>(null);
  const [draft, setDraft] = useState<SubProject | null>(() => (isNew ? createDraftSubProject() : null));
  const [draftForId, setDraftForId] = useState<string | null>(null);
  // ADR ids that exist in the last persisted version - anything else (added
  // locally since then) hasn't survived a Submit yet, so AdrSection offers a
  // quick delete for it straight from the list. Starts empty for isNew since
  // nothing is persisted until the first Submit.
  const [savedAdrIds, setSavedAdrIds] = useState<string[]>([]);
  const [historyVersion, setHistoryVersion] = useState<SubProjectVersion | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const activeDocType = searchParams.get('docType') ?? DOC_TYPES[0].id;

  useEffect(() => {
    if (isNew || !subProjectId) {
      return;
    }

    let cancelled = false;

    getSubProject(project.id, subProjectId).then((result) => {
      if (!cancelled) {
        setFetched({id: subProjectId, subProject: result.success ? result.subProject : null});
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getSubProject is recreated every render (thin useRequestHook wrapper), including it here would refetch in a loop
  }, [isNew, project.id, subProjectId]);

  // Derived-during-render reset (not an effect): local edits should survive
  // re-renders, but must be replaced wholesale when the fetched sub-project is
  // actually a different one (same pattern as DocumentationLayout's project draft).
  //
  // isNew gets its own branch (sentinel draftForId 'new') rather than relying
  // on the lazy useState initializer above - .../sub-projects/:id and
  // .../sub-projects/new render the same component at the same spot in the
  // tree, so navigating between them (e.g. viewing a doc, then clicking "New
  // sub-project") re-renders instead of remounting, and the initializer never
  // re-runs. Without this, the form kept showing whatever sub-project was
  // last viewed instead of a clean draft.
  if (isNew && draftForId !== 'new') {
    setDraftForId('new');
    setDraft(createDraftSubProject());
    setSavedAdrIds([]);
    setHistoryVersion(null);
  }

  if (!isNew && fetched && fetched.subProject && fetched.id !== draftForId) {
    setDraftForId(fetched.id);
    setDraft(fetched.subProject);
    setSavedAdrIds(fetched.subProject.documentation.adrs.map((adr) => adr.id));
    setHistoryVersion(null);
  }

  const notFound = !isNew && !!fetched && fetched.id === subProjectId && !fetched.subProject;
  const loading = !isNew && !notFound && (!fetched || fetched.id !== subProjectId || draftForId !== subProjectId);

  const handleDocTypeSelect = (id: string) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set('docType', id);
        next.delete('adrId');
        return next;
      },
      {replace: true},
    );
  };

  const updateSubProject = useCallback((updated: SubProject) => setDraft(updated), []);

  const handleSubmit = useCallback(() => {
    if (!draft) {
      return;
    }

    setSaving(true);

    saveSubProjectDocumentation(project, draft)
      .then((result) => {
        if (!result.success) {
          return;
        }

        setSavedAdrIds(draft.documentation.adrs.map((adr) => adr.id));

        if (isNew) {
          // The sidebar re-derives its sub-project list from the project it
          // reloads (cache-backed) on every route change, so navigating to
          // the real URL is enough to make it show up - no separate event.
          navigate(`/projects/${project.id}/documentation/sub-projects/${draft.id}`, {replace: true});
        }
      })
      .finally(() => setSaving(false));
  }, [project, draft, saveSubProjectDocumentation, isNew, navigate]);

  // Called both to enter history mode (before = now, so it lands on the most
  // recent saved version) and to step further back (before = that version's
  // own changedAt) - the endpoint always returns the single version strictly
  // older than `before`, there's no bulk history list to page through.
  const loadHistoryBefore = useCallback(
    (before: Date) => {
      if (!subProjectId) {
        return;
      }

      setLoadingHistory(true);

      getSubProjectHistory(project.id, subProjectId, before)
        .then((result) => {
          if (result.success) {
            setHistoryVersion(result.subProject);
            return;
          }

          toastService.push('error', "No earlier version — this is as far back as it goes.");
        })
        .finally(() => setLoadingHistory(false));
    },
    [project.id, subProjectId, getSubProjectHistory],
  );

  const handleViewHistory = useCallback(() => loadHistoryBefore(new Date()), [loadHistoryBefore]);

  const handleOlderVersion = useCallback(() => {
    if (historyVersion) {
      loadHistoryBefore(new Date(historyVersion.changedAt));
    }
  }, [historyVersion, loadHistoryBefore]);

  const handleBackToLatest = useCallback(() => setHistoryVersion(null), []);

  if (loading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading sub-project…</div>;
  }

  if (notFound || !draft) {
    return <div className="p-8 text-sm text-muted-foreground">Sub-project not found.</div>;
  }

  const subProject = historyVersion ?? draft;
  const onChange = historyVersion ? ignoreChange : updateSubProject;

  // Owned by the sub-project itself (stable across versions - draft.id is
  // the same id whichever documentation version happens to be showing, see
  // the backend note on Attachment's ownership), not a client-generated
  // draft uuid until Submit actually creates it (see createDraftSubProject)
  // - isNew has no basePath at all (Attachments step is hidden, and every
  // MarkdownEditor's imagePicker falls back to pasting a URL).
  const attachmentBasePath = isNew ? null : `/api/project/${project.id}/sub-project/${draft.id}`;

  // "<sub-project> - <tab>", e.g. "Checkout v2 - Solution Design" - heading
  // and file name of the editor toolbar's "Export to PDF".
  const docExportTitle = `${subProject.name} - ${DOC_TYPES.find((step) => step.id === activeDocType)?.label ?? ''}`;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {historyVersion && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-amber-400/30 bg-amber-400/5 px-4 py-3 text-sm text-amber-200">
          <span>
            Viewing version from {new Date(historyVersion.changedAt).toLocaleString()} by {historyVersion.changedByEmail}
            — read-only.
          </span>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<ChevronLeft className="h-4 w-4" />} onClick={handleOlderVersion} loading={loadingHistory}>
              Older version
            </Button>
            <Button variant="outline" size="sm" onClick={handleBackToLatest}>
              Back to latest
            </Button>
          </div>
        </div>
      )}

      <Input
        value={subProject.name}
        onChange={(e) => onChange({...subProject, name: e.target.value})}
        disabled={!!historyVersion}
        className="max-w-sm text-sm font-semibold"
      />
      <Stepper steps={DOC_TYPES} activeId={activeDocType} onSelect={handleDocTypeSelect} />

      <div className="min-h-0 flex-1">
        {activeDocType === 'scope' && (
          <MarkdownEditor
            className="h-full"
            exportTitle={docExportTitle}
            value={subProject.documentation.scope}
            onChange={(scope) => onChange({...subProject, documentation: {...subProject.documentation, scope}})}
            imagePicker={
              attachmentBasePath
                ? (onSelect) => (
                    <AttachmentMediaPicker basePath={attachmentBasePath} label="Sub-project attachments" onSelect={onSelect} />
                  )
                : undefined
            }
          />
        )}

        {activeDocType === 'impact-analysis' && (
          <MarkdownEditor
            className="h-full"
            exportTitle={docExportTitle}
            value={subProject.documentation.impactAnalysis}
            onChange={(impactAnalysis) =>
              onChange({...subProject, documentation: {...subProject.documentation, impactAnalysis}})
            }
            imagePicker={
              attachmentBasePath
                ? (onSelect) => (
                    <AttachmentMediaPicker basePath={attachmentBasePath} label="Sub-project attachments" onSelect={onSelect} />
                  )
                : undefined
            }
          />
        )}

        {activeDocType === 'solution-design' && (
          <MarkdownEditor
            className="h-full"
            exportTitle={docExportTitle}
            value={subProject.documentation.solutionDesign}
            onChange={(solutionDesign) =>
              onChange({...subProject, documentation: {...subProject.documentation, solutionDesign}})
            }
            imagePicker={
              attachmentBasePath
                ? (onSelect) => (
                    <AttachmentMediaPicker basePath={attachmentBasePath} label="Sub-project attachments" onSelect={onSelect} />
                  )
                : undefined
            }
          />
        )}

        {activeDocType === 'attachments' &&
          (attachmentBasePath ? (
            <AttachmentsSection basePath={attachmentBasePath} />
          ) : (
            <p className="text-sm text-muted-foreground">Save this sub-project first to attach files.</p>
          ))}

        {activeDocType === 'adr' && (
          // Read-only history: treat every ADR shown as "saved" so the quick
          // delete never appears there (deleting would be a no-op anyway,
          // since onChange is ignored while viewing history).
          <AdrSection
            subProject={subProject}
            onChange={onChange}
            savedAdrIds={historyVersion ? historyVersion.documentation.adrs.map((adr) => adr.id) : savedAdrIds}
            attachmentBasePath={attachmentBasePath}
          />
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        {!isNew && !historyVersion && (
          <Button variant="outline" leftIcon={<History className="h-4 w-4" />} onClick={handleViewHistory} loading={loadingHistory}>
            History
          </Button>
        )}
        <Button leftIcon={<Check className="h-4 w-4" />} onClick={handleSubmit} loading={saving} disabled={!!historyVersion}>
          Submit
        </Button>
      </div>
    </div>
  );
};

export default SubProjectDocumentationPage;