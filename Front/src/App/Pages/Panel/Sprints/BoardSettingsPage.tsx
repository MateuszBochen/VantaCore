import {useCallback, useEffect, useState} from 'react';
import {Check} from 'lucide-react';
import {PageContainer} from '@/components/ui/page-container';
import {useNavigate, useParams} from 'react-router-dom';
import {Input} from '@/components/ui/input';
import {Checkbox} from '@/components/ui/checkbox';
import {Button} from '@/components/ui/button';
import Stepper, {type StepperStep} from '@/components/ui/Stepper';
import {useSetModuleTitle} from '../ModuleTitle';
import useSaveBoardHook from '@/lib/Board/useSaveBoardHook';
import useGetBoardHook from '@/lib/Board/useGetBoardHook';
import createDraftBoard from './createDraftBoard';
import BoardProjectsSection from './BoardProjectsSection';
import BoardColumnsSection from './BoardColumnsSection';
import type {Board} from '@/lib/Board/Type/types';

const STEPS: StepperStep[] = [
  {id: 'basics', label: 'Basics'},
  {id: 'projects', label: 'Projects'},
  {id: 'columns', label: 'Columns'},
];

type BoardSettingsPageProps = {
  // .../sprints/new: no board exists yet, so it starts as a local draft and
  // nothing is sent to the API until Submit - same pattern as
  // ProjectSettings/TicketPage. .../sprints/:boardId's "Settings" tab
  // (see BoardPage.tsx) renders this with isNew=false instead, reading
  // boardId straight off the current route (no separate route needed for
  // it - useParams resolves against whatever matched, regardless of how
  // deep in the tree this renders).
  isNew?: boolean;
};

// A fetch result tagged with the id it was fetched for, same convention as
// TicketPage/useProjectFromRoute.
type FetchState = {
  id: string;
  board: Board | null;
};

const BoardSettingsPage = ({isNew = false}: BoardSettingsPageProps) => {
  const {boardId} = useParams<{boardId: string}>();
  const navigate = useNavigate();
  const {saveBoard} = useSaveBoardHook();
  const {getBoard} = useGetBoardHook();
  const [fetched, setFetched] = useState<FetchState | null>(null);
  const [draft, setDraft] = useState<Board | null>(null);
  const [draftForId, setDraftForId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<string>(STEPS[0].id);
  const [saving, setSaving] = useState(false);

  useSetModuleTitle(isNew ? 'New board' : (draft?.name ?? 'Board settings'));

  useEffect(() => {
    if (isNew || !boardId) {
      return;
    }

    let cancelled = false;

    getBoard(boardId).then((result) => {
      if (!cancelled) {
        setFetched({id: boardId, board: result.success ? result.board : null});
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getBoard is a thin useRequestHook wrapper recreated every render
  }, [isNew, boardId]);

  // Derived-during-render reset (not an effect) - same pattern as
  // ProjectSettings/TicketPage: isNew starts a fresh local draft, an
  // existing board's draft is replaced wholesale when the fetched board is
  // actually a different one, local edits otherwise survive re-renders.
  if (isNew && draftForId !== 'new') {
    setDraftForId('new');
    setDraft(createDraftBoard());
  }

  if (!isNew && fetched?.board && fetched.id !== draftForId) {
    setDraftForId(fetched.id);
    setDraft(fetched.board);
  }

  const handleSubmit = useCallback(() => {
    if (!draft) {
      return;
    }

    setSaving(true);

    saveBoard(draft, {isNew})
      .then((result) => {
        if (result.success && isNew) {
          navigate(`/sprints/${draft.id}`, {replace: true});
        }
      })
      .finally(() => setSaving(false));
  }, [draft, isNew, saveBoard, navigate]);

  if (!isNew && fetched?.id === boardId && !fetched?.board) {
    return <p className="p-8 text-sm text-muted-foreground">Board not found.</p>;
  }

  if (!draft) {
    return <p className="p-8 text-sm text-muted-foreground">Loading board…</p>;
  }

  return (
    <PageContainer>
      <p className="text-sm font-semibold text-foreground">{isNew ? 'New board' : `${draft.name || 'Board'} settings`}</p>

      <Stepper steps={STEPS} activeId={activeStep} onSelect={setActiveStep} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {activeStep === 'basics' && (
          <div className="flex max-w-md flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Board name</label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({...draft, name: e.target.value})}
                placeholder="e.g. Platform Sprint Board"
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Active sprint rules</p>
              <p className="text-xs text-muted-foreground">
                Applies to every sprint on this board (not configurable per sprint).
              </p>

              <label className="flex items-center gap-3 text-sm text-foreground">
                <Checkbox
                  checked={draft.allowEditTicketInActiveSprint}
                  onCheckedChange={(checked) => setDraft({...draft, allowEditTicketInActiveSprint: checked})}
                />
                Allow editing a ticket while it's in the active sprint
              </label>

              <label className="flex items-center gap-3 text-sm text-foreground">
                <Checkbox
                  checked={draft.allowChangeEstimateInActiveSprint}
                  onCheckedChange={(checked) => setDraft({...draft, allowChangeEstimateInActiveSprint: checked})}
                />
                Allow changing a ticket's estimate while it's in the active sprint
              </label>

              <label className="flex items-center gap-3 text-sm text-foreground">
                <Checkbox
                  checked={draft.allowAddTicketToActiveSprint}
                  onCheckedChange={(checked) => setDraft({...draft, allowAddTicketToActiveSprint: checked})}
                />
                Allow adding tickets to the active sprint (instead of only during planning)
              </label>

              <label className="flex items-center gap-3 text-sm text-foreground">
                <Checkbox
                  checked={draft.allowRemoveTicketFromActiveSprint}
                  onCheckedChange={(checked) => setDraft({...draft, allowRemoveTicketFromActiveSprint: checked})}
                />
                Allow removing tickets from the active sprint
              </label>
            </div>
          </div>
        )}

        {activeStep === 'projects' && (
          <BoardProjectsSection projectIds={draft.projectIds} onChange={(projectIds) => setDraft({...draft, projectIds})} />
        )}

        {activeStep === 'columns' && (
          <BoardColumnsSection
            projectIds={draft.projectIds}
            columns={draft.columns}
            onChange={(columns) => setDraft({...draft, columns})}
          />
        )}
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <Button leftIcon={<Check className="h-4 w-4" />} onClick={handleSubmit} loading={saving} disabled={!draft.name.trim()}>
          Submit
        </Button>
      </div>
    </PageContainer>
  );
};

export default BoardSettingsPage;
