import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {ReactNode} from 'react';
import {ArrowLeft, Check, ChevronLeft, History} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Select} from '@/components/ui/select';
import {PageContainer} from '@/components/ui/page-container';
import Stepper, {type StepperStep} from '@/components/ui/Stepper';
import {MarkdownPreview} from '@/components/MarkdownEditor';
import useGetTicketHook from '@/lib/Ticket/useGetTicketHook';
import useSaveTicketHook from '@/lib/Ticket/useSaveTicketHook';
import useGetTicketHistoryHook from '@/lib/Ticket/useGetTicketHistoryHook';
import {ticketCache} from '@/lib/Ticket/TicketCache';
import useListProjectSprintsHook from '@/lib/Sprint/useListProjectSprintsHook';
import type {ProjectSprintOption} from '@/lib/Sprint/useListProjectSprintsHook';
import usePatchSprintTicketsHook from '@/lib/Sprint/usePatchSprintTicketsHook';
import {eventBus} from '@/lib/EventBus/EventBus';
import {TicketWasChangedRemoteEvent} from '@/lib/WebSocket/Event/TicketWasChangedRemoteEvent';
import {TicketWasDeletedRemoteEvent} from '@/lib/WebSocket/Event/TicketWasDeletedRemoteEvent';
import {toastService} from '@/lib/Toast/ToastService';
import useTicketLayoutPreference from '@/lib/TicketLayout/useTicketLayoutPreference';
import type {WidgetId} from '@/lib/TicketLayout/Type/types';
import {useSetModuleTitle} from '../../ModuleTitle';
import createDraftTicket from './createDraftTicket';
import TicketBreadcrumb from './TicketBreadcrumb';
import TicketHistorySummary from './TicketHistorySummary';
import TicketChildrenStep from './TicketChildrenStep';
import TicketWorklogSection from './TicketWorklogSection';
import TicketTestCasesSection, {type TicketTestCasesSectionHandle} from './TicketTestCasesSection';
import TicketCommentsSection from './TicketCommentsSection';
import TicketDevelopmentSection from './TicketDevelopmentSection';
import {AttachmentsSection} from '@/components/Attachment';
import TicketWidgetGrid from './TicketWidgetGrid';
import {buildIsNewLayout, resolveGridLayout} from './ticketLayoutTemplates';
import DescriptionWidget from './TicketWidgets/DescriptionWidget';
import PrismSidebarWidget from './TicketWidgets/PrismSidebarWidget';
import FieldsWidget from './TicketWidgets/FieldsWidget';
import CustomFieldsWidget from './TicketWidgets/CustomFieldsWidget';
import WorklogWidget from './TicketWidgets/WorklogWidget';
import ChildrenWidget from './TicketWidgets/ChildrenWidget';
import RelatedWidget from './TicketWidgets/RelatedWidget';
import DevelopmentWidget from './TicketWidgets/DevelopmentWidget';
import TestCasesWidget from './TicketWidgets/TestCasesWidget';
import CommentsWidget from './TicketWidgets/CommentsWidget';
import AttachmentsWidget from './TicketWidgets/AttachmentsWidget';
import type {Ticket, TicketSprintRef, TicketVersion} from '@/lib/Ticket/Type/types';
import type {Project} from '@/lib/Project/Type/types';

// Fields TICKET_CHANGED actually carries (confirmed 2026-08-04) - everything
// on Ticket except the rollups/testCases this event doesn't include.
const COMPARABLE_TICKET_FIELDS = [
  'key',
  'subProjectId',
  'issueTypeId',
  'statusId',
  'parentId',
  'title',
  'description',
  'priority',
  'assigneeIds',
  'flagIds',
  'tags',
  'customFields',
  'relatedTickets',
] as const satisfies readonly (keyof Ticket)[];

export type TicketEditorProps = {
  project: Project;
  // Absent when isNew - a fresh draft has no id to look up yet.
  ticketId?: string;
  isNew?: boolean;
  // Only meaningful for isNew (e.g. "Add child" from TicketChildrenSection).
  parentId?: string | null;
  // The active Stepper step and its setter are owned by the CALLER (route
  // query param for the real page, local state for a popup) - this
  // component only decides what happens to `historyVersion` when it changes
  // (see handleStepSelect).
  step: string;
  onStepChange: (step: string) => void;
  // Fired once the ticket's real key is learned and it differs from the
  // `ticketId` this component was given - the real route wants to swap the
  // address bar over to it; a popup (which was already given the real
  // uuid/key) has nothing to do with this.
  onKeyResolved?: (key: string) => void;
  // Fired after an isNew draft saves successfully.
  onCreated?: (ticket: Ticket) => void;
  onBack: () => void;
  // Set by a MENTIONED_IN_COMMENT notification's link (see
  // useResolveNotificationLinkHook) - forwarded straight through to
  // TicketCommentsSection, which scrolls to and highlights that one comment
  // once it's loaded. TicketPopup has no equivalent to pass (it's never
  // opened from a notification), so this stays optional.
  highlightCommentId?: string | null;
};

// Test cases, the full worklog list, and comments each got heavy enough
// (test cases: steps + expected result + status, times however many cases
// exist; worklog: however many logged entries; comments: a thread + its own
// composer) that they're their own steps rather than stacked under the main
// ticket content - same Stepper component ProjectSettings/
// SubProjectDocumentationPage use to switch sections. isNew has nothing to
// put on any of them yet (the ticket doesn't exist), so it only ever shows
// the 'ticket' step - see the isNew guard on activeStep below.
//
// Only the 'default' layout slot still uses this - devops/jira/custom put
// every one of these sections on the 'ticket' step's widget grid instead
// (see TicketWidgetGrid), so there's nothing left to step between; those
// slots hide the Stepper entirely rather than show a single always-active
// "Ticket" pill.
const DEFAULT_SLOT_STEPS: StepperStep[] = [
  {id: 'ticket', label: 'Ticket'},
  {id: 'children', label: 'Children'},
  {id: 'worklog', label: 'Worklog'},
  {id: 'development', label: 'Development'},
  {id: 'test-cases', label: 'Test Cases'},
  {id: 'comments', label: 'Comments'},
  {id: 'attachments', label: 'Attachments'},
];

// A fetch result tagged with the id it was fetched for, same convention as
// useProjectFromRoute/SubProjectDocumentationPage's FetchState.
type FetchState = {
  id: string;
  ticket: Ticket | null;
};

// The actual ticket edit view - deliberately router-independent (no
// useParams/useNavigate/useSearchParams) so it can be reused both by the
// real /projects/:projectId/tickets/:ticketId route (TicketPage, a thin
// wrapper supplying router-derived props) and by TicketPopup (a floating
// window with no route of its own at all). See memory:
// feedback_always_use_ui_components - a prior attempt to reuse TicketPage
// as-is inside a popup via a sandboxed MemoryRouter (or even a fully
// separate React root) kept hitting either a "nested Router" crash or a
// "must be used within a ModuleTitleProvider" crash, because BOTH react-
// router hooks AND this component's own useSetModuleTitle call need to be
// genuinely inside the app's real provider tree - splitting the router
// dependency out (this file) instead of trying to fake a router around it
// was the actual fix.
const TicketEditor = ({
  project,
  ticketId,
  isNew = false,
  parentId = null,
  step,
  onStepChange,
  onKeyResolved,
  onCreated,
  onBack,
  highlightCommentId = null,
}: TicketEditorProps) => {
  const {getTicket} = useGetTicketHook();
  const {saveTicket} = useSaveTicketHook();
  const {getTicketHistory} = useGetTicketHistoryHook();
  const {listProjectSprints} = useListProjectSprintsHook();
  const {patchSprintTickets} = usePatchSprintTicketsHook();
  const {preference: layoutPreference} = useTicketLayoutPreference();
  const {activeSlot} = layoutPreference;
  const gridLayout = useMemo(() => resolveGridLayout(layoutPreference, activeSlot), [layoutPreference, activeSlot]);
  const [fetched, setFetched] = useState<FetchState | null>(null);
  const [draft, setDraft] = useState<Ticket | null>(null);
  const [draftForId, setDraftForId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [staleRemote, setStaleRemote] = useState(false);
  const [deletedRemote, setDeletedRemote] = useState(false);
  // Sentinel for the render-phase reset of the two flags above - they clear
  // the moment the editor switches to a different ticket (see below), no
  // effect needed.
  const [remoteFlagsTicketId, setRemoteFlagsTicketId] = useState(ticketId);
  const [historyVersion, setHistoryVersion] = useState<TicketVersion | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sprintOptions, setSprintOptions] = useState<ProjectSprintOption[]>([]);
  const upgradedRef = useRef(new Set<string>());
  const testCasesRef = useRef<TicketTestCasesSectionHandle>(null);
  // The sprint the ticket was last known to actually be in, sourced from the
  // ticket's own load (or null for a fresh draft) - handleSubmit diffs
  // draft.sprint against this to know whether Sprint's own PATCH needs to
  // fire at all, and updates it once that PATCH succeeds. Deliberately not
  // `resolvedTicket?.sprint` read live: resolvedTicket stays the pristine
  // pre-edit snapshot after a save (nothing here re-fetches it), so a second
  // sprint change in the same session would otherwise keep diffing against
  // the very first value ever loaded instead of the last one actually synced.
  // State, not a ref: it's reset in the render-phase ticket-swap blocks below
  // alongside setDraft, and updated from performTicketPut's async result.
  const [lastSyncedSprint, setLastSyncedSprint] = useState<TicketSprintRef | null>(null);

  useEffect(() => {
    let cancelled = false;

    listProjectSprints(project.id).then((result) => {
      if (!cancelled && result.success) {
        setSprintOptions(result.sprints);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listProjectSprints is a thin useRequestHook wrapper recreated every render
  }, [project.id]);

  // devops/jira/custom have nothing to step to - every section besides
  // 'ticket' is a widget on that step's own grid instead (see
  // DEFAULT_SLOT_STEPS' own comment). Forcing 'ticket' here (not just hiding
  // the Stepper) also covers a stale `?step=` left over from switching away
  // from 'default' while on some other step.
  const activeStep = isNew || activeSlot !== 'default' ? 'ticket' : step;

  const handleStepSelect = (id: string) => {
    // History only applies to the ticket step's own fields - leaving it
    // exits history mode rather than leaving the banner up over content it
    // doesn't describe.
    if (id !== 'ticket') {
      setHistoryVersion(null);
    }

    onStepChange(id);
  };

  // Called both to enter history mode (before = now, so it lands on the most
  // recent saved version) and to step further back (before = that version's
  // own changedAt) - the endpoint always returns the single version strictly
  // older than `before`, there's no bulk history list to page through. Same
  // mechanism as SubProjectDocumentationPage's loadHistoryBefore.
  const loadHistoryBefore = useCallback(
    (before: Date) => {
      if (!draft) {
        return;
      }

      setLoadingHistory(true);

      // draft.id, not the caller's `ticketId` - the real route upgrades the
      // address bar to the human key once known (see onKeyResolved below),
      // but this endpoint only accepts the real uuid, same as worklog/
      // comments/test cases.
      getTicketHistory(project.id, draft.id, before)
        .then((result) => {
          if (result.success) {
            setHistoryVersion(result.version);
            return;
          }

          toastService.push('error', "No earlier version — this is as far back as it goes.");
        })
        .finally(() => setLoadingHistory(false));
    },
    [project, draft, getTicketHistory],
  );

  const handleViewHistory = useCallback(() => loadHistoryBefore(new Date()), [loadHistoryBefore]);

  const handleOlderVersion = useCallback(() => {
    if (historyVersion) {
      loadHistoryBefore(new Date(historyVersion.changedAt));
    }
  }, [historyVersion, loadHistoryBefore]);

  const handleBackToLatest = useCallback(() => setHistoryVersion(null), []);

  useEffect(() => {
    if (isNew || !ticketId) {
      return;
    }

    let cancelled = false;

    getTicket(project.id, ticketId).then((result) => {
      if (!cancelled) {
        setFetched({id: ticketId, ticket: result.success ? result.ticket : null});
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getTicket is a thin useRequestHook wrapper recreated every render, including it here would refetch in a loop
  }, [isNew, project.id, ticketId]);

  // Backend accepts either the ticket's uuid or its human-readable key (e.g.
  // VC-1042) in the route segment - once a fetch resolves and we learn the
  // real key, the real page upgrades the address bar to it (via
  // onKeyResolved), whether that id came from the isNew->created redirect
  // (which has no key yet to navigate to directly) or from a link built off
  // a raw id elsewhere (TicketRow, Related tickets). A popup has no address
  // bar of its own, so onKeyResolved is optional and simply skipped there.
  //
  // upgradedRef guards against re-firing for a ticket we've already
  // resolved once: this effect and the fetch effect above both depend on
  // `ticketId`, so a real navigate() in the caller re-triggers both, and if
  // `fetched` is still holding the previous render's value when this one
  // re-runs, the key/ticketId comparison could flip back and forth instead
  // of settling - keying by the ticket's real id makes a second call for
  // the same ticket structurally impossible regardless of how that race
  // plays out.
  useEffect(() => {
    if (isNew || !fetched?.ticket) {
      return;
    }

    const key = fetched.ticket.key;

    if (key && ticketId !== key && !upgradedRef.current.has(fetched.ticket.id)) {
      upgradedRef.current.add(fetched.ticket.id);
      onKeyResolved?.(key);
    }
  }, [isNew, fetched, ticketId, onKeyResolved]);

  // Switching the editor to a different ticket clears the "changed/deleted
  // elsewhere" banners - render-phase (converges on the sentinel), same
  // pattern as the draft-swap blocks further down.
  if (remoteFlagsTicketId !== ticketId) {
    setRemoteFlagsTicketId(ticketId);
    setStaleRemote(false);
    setDeletedRemote(false);
  }

  // Latest draft, read from the websocket handler below without
  // resubscribing on every keystroke (typing in the title/description would
  // otherwise be a dependency). Synced in a passive effect rather than during
  // render - the only readers are async websocket handlers, which never run
  // before the effect has committed.
  const latestDraftRef = useRef(draft);
  useEffect(() => {
    latestDraftRef.current = draft;
  });

  // Someone else (or this same account in another tab) saved this ticket -
  // rather than silently overwriting whatever the user's looking at (which
  // could clobber in-progress edits, or yank the cursor mid-typing), this
  // just flags it as stale; the banner below lets them reload explicitly.
  // Comparing against the current draft first filters out the echo of this
  // tab's own save, which would otherwise already match and need no banner.
  useEffect(() => {
    if (isNew) {
      return;
    }

    const handleTicketChangedRemotely = (remoteEvent: TicketWasChangedRemoteEvent) => {
      if (typeof remoteEvent.payload !== 'object' || remoteEvent.payload === null) {
        return;
      }

      const record = remoteEvent.payload as Record<string, unknown>;
      const currentDraft = latestDraftRef.current;

      if (!currentDraft || record.id !== currentDraft.id) {
        return;
      }

      const changed = COMPARABLE_TICKET_FIELDS.some(
        (field) => field in record && JSON.stringify(record[field]) !== JSON.stringify(currentDraft[field]),
      );

      if (changed) {
        setStaleRemote(true);
      }
    };

    eventBus.subscribe<TicketWasChangedRemoteEvent>(TicketWasChangedRemoteEvent.name, handleTicketChangedRemotely);

    return () => {
      eventBus.unsubscribe<TicketWasChangedRemoteEvent>(TicketWasChangedRemoteEvent.name, handleTicketChangedRemotely);
    };
  }, [isNew]);

  // Someone deleted the ticket currently open in this editor - unlike a
  // plain edit, there's nothing to reload into: flag it so the banner below
  // can explain why and route the user back rather than letting them keep
  // editing (and eventually Submit) a ticket that no longer exists.
  useEffect(() => {
    if (isNew) {
      return;
    }

    const handleTicketDeletedRemotely = (remoteEvent: TicketWasDeletedRemoteEvent) => {
      if (typeof remoteEvent.payload !== 'object' || remoteEvent.payload === null) {
        return;
      }

      const record = remoteEvent.payload as Record<string, unknown>;
      const currentDraft = latestDraftRef.current;

      if (!currentDraft || record.ticketId !== currentDraft.id) {
        return;
      }

      setDeletedRemote(true);
    };

    eventBus.subscribe<TicketWasDeletedRemoteEvent>(TicketWasDeletedRemoteEvent.name, handleTicketDeletedRemotely);

    return () => {
      eventBus.unsubscribe<TicketWasDeletedRemoteEvent>(TicketWasDeletedRemoteEvent.name, handleTicketDeletedRemotely);
    };
  }, [isNew]);

  const handleReload = useCallback(() => {
    if (!ticketId) {
      return;
    }

    ticketCache.delete(ticketId);
    setStaleRemote(false);
    setHistoryVersion(null);

    getTicket(project.id, ticketId).then((result) => {
      if (result.success) {
        setFetched({id: ticketId, ticket: result.ticket});
        setDraftForId(result.ticket.id);
        setDraft(result.ticket);
        setLastSyncedSprint(result.ticket.sprint);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getTicket is a thin useRequestHook wrapper recreated every render
  }, [project, ticketId]);

  // Derived-during-render (not an effect), same pattern as
  // SubProjectDocumentationPage: isNew starts a local draft as soon as the
  // project it belongs to has loaded (createDraftTicket needs project.id),
  // and an existing ticket's draft is replaced wholesale when the fetched
  // ticket is actually a different one - local edits otherwise survive re-renders.
  //
  // The sentinel includes parentId, not just project.id: .../tickets/new
  // renders the same component at the same spot in the tree regardless of
  // the ?parentId= query, so clicking "Add child" on a different ticket
  // while already on .../tickets/new re-renders instead of remounting - a
  // sentinel of just project.id would never notice the parent changed and
  // would leave the previous child draft on screen.
  const newDraftKey = `new:${project.id}:${parentId ?? ''}`;

  if (isNew && draftForId !== newDraftKey) {
    setDraftForId(newDraftKey);
    setDraft(createDraftTicket(project.id, parentId));
    setHistoryVersion(null);
    setLastSyncedSprint(null);
  }

  // Matched by the ticket's own id/key, not by the literal string `fetched`
  // was requested with - the uuid->key upgrade above swaps to the key
  // before this fetch's *next* request settles, and matching on fetched.id
  // alone would treat that as a different ticket for one render, resetting
  // draftForId/draft (and briefly failing `loading` below) even though it's
  // the exact same resource.
  const resolvedTicket =
    fetched?.ticket && (fetched.ticket.id === ticketId || fetched.ticket.key === ticketId) ? fetched.ticket : null;

  if (!isNew && resolvedTicket && resolvedTicket.id !== draftForId) {
    setDraftForId(resolvedTicket.id);
    setDraft(resolvedTicket);
    setHistoryVersion(null);
    setLastSyncedSprint(resolvedTicket.sprint);
  }

  useSetModuleTitle(draft ? `${project.name} - ${draft.title || 'New ticket'}` : null);

  // Root-first chain of parent tickets (NOT including draft itself) so the
  // header can show "root / child / ..." next to the key - same walk-up-by-
  // parentId approach as useSprintRail's walkToRoot, just local to this one
  // ticket instead of building rails for a whole board. getTicket checks
  // ticketCache first, so re-walking on every draft change is cheap once
  // ancestors have already been visited elsewhere.
  const [ancestors, setAncestors] = useState<Ticket[]>([]);

  useEffect(() => {
    let cancelled = false;

    const resolveAncestors = async () => {
      const chain: Ticket[] = [];
      let currentParentId: string | null = draft?.parentId ?? null;

      while (currentParentId) {
        const result = await getTicket(project.id, currentParentId);

        if (!result.success) {
          break;
        }

        chain.unshift(result.ticket);
        currentParentId = result.ticket.parentId;
      }

      if (!cancelled) {
        setAncestors(chain);
      }
    };

    void resolveAncestors();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getTicket is a thin useRequestHook wrapper recreated every render
  }, [draft?.parentId, project.id]);

  // The parent ticket's own issue type, once resolved - `ancestors` is
  // root-first, so the immediate parent is always the last entry (null
  // momentarily right after navigating to a new child, since it's resolved
  // async above).
  const parentIssueType = useMemo(() => {
    if (!draft?.parentId || ancestors.length === 0) {
      return null;
    }

    const parentTicket = ancestors[ancestors.length - 1];
    return project.issueTypes.find((type) => type.id === parentTicket.issueTypeId) ?? null;
  }, [draft?.parentId, ancestors, project.issueTypes]);

  // Read as plain locals (not `draft.x` inside the callbacks below) so the
  // memo/render-phase logic depends on just these two fields, not the whole
  // draft that changes on every keystroke.
  const draftParentId = draft?.parentId ?? null;
  const draftIssueTypeId = draft?.issueTypeId ?? null;

  // Only offers the types Hierarchy settings actually allow as children of
  // the parent's type (see HierarchySection/IssueType.childTypeIds) - falls
  // back to every project issue type when there's no parent (a root ticket
  // can be anything) or the parent's type hasn't resolved yet (better a
  // brief unrestricted list than a flash of an empty one), and always keeps
  // whatever's already selected even if the hierarchy changed since - a
  // stale value shouldn't just vanish from its own dropdown.
  const childIssueTypeOptions = useMemo(() => {
    if (!draftParentId || !parentIssueType) {
      return project.issueTypes;
    }

    return project.issueTypes.filter(
      (type) => parentIssueType.childTypeIds.includes(type.id) || type.id === draftIssueTypeId,
    );
  }, [draftParentId, draftIssueTypeId, parentIssueType, project.issueTypes]);

  // Auto-picks the child's type the moment the parent's allowed children
  // narrow down to exactly one option (the common case - most hierarchies
  // define a single child type per parent) instead of leaving a fresh draft
  // sitting on the placeholder until the user manually opens the dropdown.
  // Only for a brand-new, not-yet-typed draft - never overwrites a type the
  // user (or a previously saved ticket) already has. Render-phase (converges
  // once issueTypeId is set), same pattern as the draft-swap blocks above.
  if (isNew && draft && !draft.issueTypeId && parentIssueType && parentIssueType.childTypeIds.length === 1) {
    const onlyChildType = project.issueTypes.find((type) => type.id === parentIssueType.childTypeIds[0]);

    if (onlyChildType) {
      setDraft((prev) =>
        prev && !prev.issueTypeId
          ? {
              ...prev,
              issueTypeId: onlyChildType.id,
              statusId: onlyChildType.initialStatusId ?? onlyChildType.workflow[0]?.statusId ?? '',
              ...(!prev.title.trim() && !prev.description.trim()
                ? {title: onlyChildType.titleTemplate ?? '', description: onlyChildType.descriptionTemplate ?? ''}
                : {}),
            }
          : prev,
      );
    }
  }

  // Stable identity (functional setState, no `draft` in the closure) so a
  // memoized MarkdownEditor (see components/MarkdownEditor) can actually skip
  // re-rendering its whole Tiptap tree when some OTHER field changes - an
  // inline arrow function recreated every render would defeat that even with
  // an unchanged `value`.
  const handleDescriptionChange = useCallback((description: string) => {
    setDraft((prev) => (prev ? {...prev, description} : prev));
  }, []);

  // Same idea, for everything TicketSidebar's faces edit (status, priority,
  // assignees, custom fields, ...): a patch merged against the LATEST draft
  // via functional setState, never a spread of whatever `ticket` prop the
  // calling face happens to hold - see sidebarTicket below for why that
  // matters (that prop is deliberately allowed to go stale on title/
  // description, and spreading a stale snapshot back out would silently
  // revert whichever one just changed).
  const handleFieldsPatch = useCallback((patch: Partial<Ticket>) => {
    setDraft((prev) => (prev ? {...prev, ...patch} : prev));
  }, []);

  // TicketSidebar and its 5 always-mounted faces (Fields, Custom Fields,
  // Worklog stopwatch, Children, Related) are expensive to re-render - each
  // face owns its own hooks/effects/API calls, and none of them show or edit
  // title/description. Without this, `draft` getting a new reference on
  // every keystroke in the Title input or the description editor would
  // re-render all five every single time. Recomputing only when a field the
  // sidebar actually reads/writes changes (deliberately excluding
  // draft.title/draft.description from the dependency list) keeps this
  // reference stable while typing there, so React.memo on TicketSidebar (and
  // each face) can actually bail out instead of seeing a "new" ticket prop
  // every render.
  const sidebarTicket = useMemo(
    () => draft,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberately excludes draft.title/draft.description, see comment above
    [
      draft?.id,
      draft?.key,
      draft?.authorId,
      draft?.projectId,
      draft?.subProjectId,
      draft?.sprint,
      draft?.issueTypeId,
      draft?.statusId,
      draft?.parentId,
      draft?.priority,
      draft?.estimate,
      draft?.assigneeIds,
      draft?.flagIds,
      draft?.tags,
      draft?.customFields,
      draft?.relatedTickets,
      draft?.timeSpent,
      draft?.timeSpentAll,
      draft?.estimateAll,
      draft?.progress,
    ],
  );

  // The ticket PUT + any sprint-membership patch it triggers - shared by
  // both handleSubmit branches below, since devops/jira/custom always run
  // this (no separate 'ticket' step to gate it behind), while 'default'
  // only runs it when NOT on the 'test-cases' step. Resolves once the whole
  // thing (including any sprint ADD/REMOVE) is done; never rejects on its
  // own failure paths, they're all handled internally (toast + revert).
  const performTicketPut = useCallback((): Promise<void> => {
    if (!draft) {
      return Promise.resolve();
    }

    const priorSprint = lastSyncedSprint;
    const nextSprint = draft.sprint;
    const sprintChanged = (priorSprint?.id ?? null) !== (nextSprint?.id ?? null);

    return saveTicket(project.id, draft, {isNew}).then((result) => {
      if (!result.success) {
        return;
      }

      if (isNew) {
        onCreated?.(draft);
      }

      if (!sprintChanged) {
        return;
      }

      // Sprint membership lives on the Sprint aggregate (see
      // usePatchSprintTicketsHook), not on the ticket PUT above - draft.id
      // is already the real, final ticket id even for isNew (client-
      // generated up front, see createDraftTicket), so it's safe to fire
      // this in the same pass instead of waiting for a re-fetch.
      const removal = priorSprint ? sprintOptions.find(({sprint}) => sprint.id === priorSprint.id) : undefined;
      const addition = nextSprint ? sprintOptions.find(({sprint}) => sprint.id === nextSprint.id) : undefined;

      // Reverts the sidebar's visible sprint back to whatever's actually
      // true server-side - only meaningful once draft has moved on from
      // what we're patching for (a slower stale response landing after a
      // newer edit already replaced it), otherwise a plain setDraft is fine.
      const revertDraftSprint = (sprint: TicketSprintRef | null) => {
        setDraft((prev) => (prev && prev.id === draft.id ? {...prev, sprint} : prev));
      };

      if (priorSprint && !removal) {
        // The old sprint's board isn't (or is no longer) linked to this
        // project, so it never made it into sprintOptions - nothing to
        // resolve a boardId from. Rare (would need the board unlinked
        // after the ticket was already assigned); surfaced so it's not
        // silently swallowed rather than actually handled. Nothing was
        // actually removed, so revert the pending selection too.
        toastService.push('error', `Couldn't remove the ticket from its previous sprint "${priorSprint.sprintName}" — its board could not be resolved.`);
        revertDraftSprint(priorSprint);
        return;
      }

      // Sequential, not Promise.all - Ticket.sprint is single-valued (a
      // ticket is in at most one sprint at a time), so ADD has to run
      // after REMOVE has actually landed, not racing it. If REMOVE fails
      // (e.g. the board doesn't allow leaving an already-started sprint),
      // ADD never fires at all - moving to a new sprint shouldn't half-
      // succeed by adding to the new one while still stuck in the old one.
      const applySprintChange = async () => {
        if (removal) {
          const removeResult = await patchSprintTickets(removal.sprint.boardId, removal.sprint.id, draft.id, 'REMOVE');

          if (!removeResult.success) {
            revertDraftSprint(priorSprint);
            return;
          }
        }

        if (addition) {
          const addResult = await patchSprintTickets(addition.sprint.boardId, addition.sprint.id, draft.id, 'ADD');

          if (!addResult.success) {
            // The removal (if any) already went through - the ticket
            // really is sprint-less now, not still on its old sprint, so
            // that's what both the synced value and the visible field fall
            // back to.
            setLastSyncedSprint(null);
            revertDraftSprint(null);
            return;
          }
        }

        setLastSyncedSprint(nextSprint);
      };

      return applySprintChange();
    });
  }, [project, draft, isNew, saveTicket, onCreated, sprintOptions, patchSprintTickets, lastSyncedSprint]);

  const handleSubmit = useCallback(() => {
    if (!draft) {
      return;
    }

    setSaving(true);

    // 'default' slot: unchanged from before the widget grid existed - Test
    // Cases is still its own Stepper step (see TicketTestCasesSection), so
    // Submit does one or the other depending on which one's active.
    if (activeSlot === 'default') {
      if (activeStep === 'test-cases') {
        (testCasesRef.current?.submit() ?? Promise.resolve()).finally(() => setSaving(false));
        return;
      }

      performTicketPut().finally(() => setSaving(false));
      return;
    }

    // devops/jira/custom: every section is a simultaneously-visible widget
    // on one grid, not a step to switch to - Submit always saves the ticket
    // PUT, plus flushes Test Cases too if that widget happens to be in the
    // active layout. Worklog/Comments/Attachments save immediately through
    // their own endpoints regardless, same as 'default'.
    const testCasesFlush = gridLayout.some((item) => item.widgetId === 'testCases')
      ? (testCasesRef.current?.submit() ?? Promise.resolve())
      : Promise.resolve();

    Promise.all([performTicketPut(), testCasesFlush]).finally(() => setSaving(false));
  }, [draft, activeSlot, activeStep, performTicketPut, gridLayout]);

  const notFound = !isNew && !!fetched && fetched.id === ticketId && !fetched.ticket;
  // Deliberately NOT an early return once `draft` is already populated - see
  // below. Only used to dim the existing content while a parent/child nav
  // re-fetches the next ticket.
  const loading = !isNew && !notFound && !resolvedTicket;

  if (notFound) {
    return <div className="p-8 text-sm text-muted-foreground">Ticket not found.</div>;
  }

  // First-ever render for this route (no previous ticket to keep showing) -
  // any later navigation to a sibling/parent/child instead falls through to
  // the main return below with the previous `draft` still on screen, so the
  // whole page doesn't blank out to this placeholder and jump on every click
  // (see TicketBreadcrumb / TicketChildrenSection callers).
  if (!draft) {
    return <div className="p-8 text-sm text-muted-foreground">Loading ticket…</div>;
  }

  // Draft's `id` is only a client-generated uuid until Submit actually
  // creates the ticket (see createDraftTicket) - there's no real ticket to
  // attach files to yet, so isNew has no basePath at all (Attachments step
  // is hidden, and MarkdownEditor's imagePicker falls back to pasting a URL).
  const attachmentBasePath = isNew ? null : `/api/project/${project.id}/ticket/${draft.id}`;

  // Every widget the current layout COULD place - TicketWidgetGrid itself
  // only renders whichever of these `gridLayout` actually positions, so no
  // need to branch this map by activeSlot. Gated the same way TicketSidebar's
  // own faces and the Stepper steps above always have been: worklog/children/
  // related/development/testCases/comments need a persisted ticket (isNew
  // has nothing to show yet), attachments needs attachmentBasePath.
  const widgetMap: Partial<Record<WidgetId, ReactNode>> = {
    description: (
      <DescriptionWidget
        description={draft.description}
        onChange={handleDescriptionChange}
        attachmentBasePath={attachmentBasePath}
        // key is '' until the ticket is created (see createDraftTicket).
        exportTitle={[draft.key, draft.title].filter(Boolean).join(' ')}
      />
    ),
    prismSidebar: (
      <PrismSidebarWidget
        project={project}
        ticket={sidebarTicket ?? draft}
        onChange={handleFieldsPatch}
        projectId={project.id}
        isNew={isNew}
        sprintOptions={sprintOptions}
      />
    ),
    fields: <FieldsWidget project={project} ticket={sidebarTicket ?? draft} onChange={handleFieldsPatch} sprintOptions={sprintOptions} />,
    customFields: <CustomFieldsWidget project={project} ticket={sidebarTicket ?? draft} onChange={handleFieldsPatch} />,
  };

  if (!isNew) {
    widgetMap.worklog = (
      <WorklogWidget projectId={project.id} ticket={draft} onChange={setDraft} onFieldsChange={handleFieldsPatch} />
    );
    widgetMap.children = (
      <ChildrenWidget projectId={project.id} ticket={draft} issueTypes={project.issueTypes} statuses={project.statuses} />
    );
    widgetMap.related = <RelatedWidget ticket={draft} onChange={handleFieldsPatch} />;
    widgetMap.development = <DevelopmentWidget projectId={project.id} ticketId={draft.id} />;
    widgetMap.testCases = <TestCasesWidget ref={testCasesRef} projectId={project.id} ticketId={draft.id} />;
    widgetMap.comments = <CommentsWidget projectId={project.id} ticketId={draft.id} highlightCommentId={highlightCommentId} />;
  }

  if (attachmentBasePath) {
    widgetMap.attachments = <AttachmentsWidget basePath={attachmentBasePath} />;
  }

  // isNew only ever has description/prismSidebar/fields/customFields to
  // show (see widgetMap above) - stacked full-width instead of the saved
  // layout's own multi-column x/y/w/h, which otherwise leaves every column
  // reserved for a widget isNew can't show (Worklog/Children/...) sitting
  // empty. Reverts to the real, unfiltered gridLayout the moment isNew goes
  // false (post-save navigation to the real ticket).
  const displayedGridLayout = isNew ? buildIsNewLayout(gridLayout, Object.keys(widgetMap)) : gridLayout;

  return (
    <PageContainer className={`min-h-0 transition-opacity ${loading ? 'pointer-events-none opacity-60' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            disableRipple
            onClick={onBack}
            className="h-auto min-w-0 gap-1 rounded-md p-0 text-sm text-muted-foreground hover:bg-transparent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Tickets
          </Button>

          {project.flags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {project.flags.map((flag) => {
                const active = (historyVersion ?? draft).flagIds.includes(flag.id);
                return (
                  <Button
                    key={flag.id}
                    variant="ghost"
                    size="sm"
                    disableRipple
                    disabled={!!historyVersion}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        flagIds: active ? draft.flagIds.filter((id) => id !== flag.id) : [...draft.flagIds, flag.id],
                      })
                    }
                    className="h-auto rounded-full px-2.5 py-1 text-xs font-medium transition-opacity hover:bg-transparent"
                    style={{
                      backgroundColor: `${flag.color}${active ? '33' : '14'}`,
                      color: flag.color,
                      opacity: active ? 1 : 0.5,
                    }}
                  >
                    {flag.name}
                  </Button>
                );
              })}
            </div>
          )}
        </div>

        <TicketBreadcrumb projectId={project.id} ancestors={ancestors} currentTitle={draft.title} ticketKey={draft.key} />
      </div>

      {deletedRemote && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-red-200">
          <span>This ticket was deleted elsewhere — it no longer exists.</span>
          <Button
            variant="ghost"
            size="sm"
            disableRipple
            onClick={onBack}
            className="h-auto shrink-0 rounded-md px-2 py-1 text-red-200 hover:bg-destructive/20"
          >
            Back to tickets
          </Button>
        </div>
      )}

      {staleRemote && !deletedRemote && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm text-amber-200">
          <span>This ticket was updated elsewhere — your view may be out of date.</span>
          <Button
            variant="ghost"
            size="sm"
            disableRipple
            onClick={handleReload}
            className="h-auto shrink-0 rounded-md px-2 py-1 text-amber-200 hover:bg-amber-400/20"
          >
            Reload
          </Button>
        </div>
      )}

      <div className="flex w-full items-center gap-3">
        <Select
          value={(historyVersion ?? draft).issueTypeId}
          onValueChange={(issueTypeId) => {
            const nextType = project.issueTypes.find((type) => type.id === issueTypeId) ?? null;
            const statusId = nextType?.initialStatusId ?? nextType?.workflow[0]?.statusId ?? '';
            // Only ever a starting point for a still-blank NEW draft - never
            // overwrites real content, and never applies to an existing
            // ticket just because its type gets edited (isNew guards that).
            const applyTemplate = isNew && !draft.title.trim() && !draft.description.trim();
            setDraft({
              ...draft,
              issueTypeId,
              statusId,
              ...(applyTemplate ? {title: nextType?.titleTemplate ?? '', description: nextType?.descriptionTemplate ?? ''} : {}),
            });
          }}
          disabled={!!historyVersion}
          placeholder="Select a type…"
          className="w-48 shrink-0"
          options={childIssueTypeOptions.map((type) => ({value: type.id, label: type.name}))}
        />

        <Input
          value={(historyVersion ?? draft).title}
          onChange={(e) => setDraft({...draft, title: e.target.value})}
          disabled={!!historyVersion}
          placeholder="Ticket title…"
          className="min-w-0 flex-1 text-lg font-semibold"
        />
      </div>

      {!isNew && activeSlot === 'default' && <Stepper steps={DEFAULT_SLOT_STEPS} activeId={activeStep} onSelect={handleStepSelect} />}

      {/* Everything below scrolls as one region, independent of the header
          above (back/flags/breadcrumb, issue type + title, Stepper) and the
          History/Submit footer below - both of those stay pinned in place
          instead of moving with the content, per feedback: previously the
          whole PageContainer scrolled together, taking the footer buttons
          (and the issue type/title row) along with it. */}
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
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

        {activeStep === 'ticket' &&
          (historyVersion ? (
            // Viewing an older saved version stays the same simple read-only
            // pair regardless of the active layout slot - none of the other
            // widgets (Children/Worklog/...) have a historical view to show,
            // so there's nothing meaningful to put on a grid here.
            <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row">
              <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6">
                <MarkdownPreview source={historyVersion.description} className="min-h-0 flex-1 overflow-y-auto" />
              </div>
              <TicketHistorySummary project={project} version={historyVersion} />
            </div>
          ) : (
            <TicketWidgetGrid layout={displayedGridLayout} widgets={widgetMap} ticketKey={draft.id} />
          ))}

        {!isNew && activeStep === 'children' && (
          <TicketChildrenStep
            projectId={project.id}
            ticket={draft}
            issueTypes={project.issueTypes}
            statuses={project.statuses}
          />
        )}

        {!isNew && activeStep === 'worklog' && <TicketWorklogSection projectId={project.id} ticket={draft} onChange={setDraft} />}

        {!isNew && activeStep === 'development' && <TicketDevelopmentSection projectId={project.id} ticketId={draft.id} />}

        {!isNew && activeStep === 'test-cases' && (
          <TicketTestCasesSection ref={testCasesRef} projectId={project.id} ticketId={draft.id} />
        )}

        {!isNew && activeStep === 'comments' && (
          <TicketCommentsSection projectId={project.id} ticketId={draft.id} highlightCommentId={highlightCommentId} />
        )}

        {attachmentBasePath && activeStep === 'attachments' && <AttachmentsSection basePath={attachmentBasePath} />}
      </div>

      {/* Worklog, Comments and Attachments save immediately through their own endpoints
          (see TicketWorklogSection/TicketCommentsSection/AttachmentsSection) - Submit only
          applies here. Test Cases keeps Submit too, but handleSubmit routes
          it to its own dedicated endpoint (useSaveTestCasesHook) instead of
          the general ticket PUT - the title/type/status requirements below
          are about that PUT, so they don't apply on this step. */}
      {(activeStep === 'ticket' || activeStep === 'test-cases') && (
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          {!isNew && activeStep === 'ticket' && !historyVersion && (
            <Button variant="outline" leftIcon={<History className="h-4 w-4" />} onClick={handleViewHistory} loading={loadingHistory}>
              History
            </Button>
          )}
          <Button
            leftIcon={<Check className="h-4 w-4" />}
            onClick={handleSubmit}
            loading={saving}
            disabled={
              deletedRemote ||
              !!historyVersion ||
              (activeStep === 'ticket' && (!draft.title.trim() || !draft.issueTypeId || !draft.statusId))
            }
          >
            Submit
          </Button>
        </div>
      )}
    </PageContainer>
  );
};

export default TicketEditor;
