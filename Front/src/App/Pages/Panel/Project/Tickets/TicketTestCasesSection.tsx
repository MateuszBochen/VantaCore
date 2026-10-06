import {forwardRef, useEffect, useImperativeHandle, useState} from 'react';
import {Plus, Trash2, X} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Select} from '@/components/ui/select';
import {Button} from '@/components/ui/button';
import {UserChip} from '@/components/ui/user-chip';
import {Surface} from '@/components/ui/surface';
import Stepper, {type StepperStep} from '@/components/ui/Stepper';
import useListTestCasesHook from '@/lib/Ticket/useListTestCasesHook';
import useSaveTestCasesHook from '@/lib/Ticket/useSaveTestCasesHook';
import useDeleteTestCaseHook from '@/lib/Ticket/useDeleteTestCaseHook';
import type {TestCase, TestCaseStatus} from '@/lib/Ticket/Type/types';

const STATUS_OPTIONS: {value: TestCaseStatus; label: string}[] = [
  {value: 'not-run', label: 'Not run'},
  {value: 'passed', label: 'Passed'},
  {value: 'failed', label: 'Failed'},
  {value: 'blocked', label: 'Blocked'},
];

const STATUS_STYLES: Record<TestCaseStatus, string> = {
  'not-run': 'bg-muted text-muted-foreground',
  passed: 'bg-emerald-400/20 text-emerald-300',
  failed: 'bg-red-400/20 text-red-300',
  blocked: 'bg-amber-400/20 text-amber-300',
};

const createTestCase = (): TestCase => ({
  id: crypto.randomUUID(),
  title: 'New test case',
  steps: [''],
  expectedResult: '',
  status: 'not-run',
});

export type TicketTestCasesSectionHandle = {
  submit: () => Promise<void>;
};

type TicketTestCasesSectionProps = {
  projectId: string;
  ticketId: string;
};

// Tagged by the ticket it was fetched for, same convention as
// TicketWorklogSection/TicketCommentsSection.
type FetchState = {
  id: string;
  testCases: TestCase[];
};

// Ad-hoc per ticket, not a reusable per-project library - each ticket's test
// cases are authored from scratch here, no cross-ticket catalog/linking.
//
// One test case shown at a time via Stepper (same component ProjectSettings/
// SubProjectDocumentationPage use to switch sections) instead of an
// accordion list - a case with several steps + expected result + status
// took up a lot of vertical space multiplied by however many cases existed.
//
// Test cases have their own endpoints, fetched lazily like Worklog/Comments
// - but unlike those, edits and new cases are staged locally and only sent
// as a single bulk PUT when the page-level Submit button fires (there's no
// per-entry save endpoint, just a bulk one) - see the imperative `submit`
// handle below, called from TicketPage's handleSubmit. Deletion is
// immediate instead, through its own dedicated endpoint, since there's no
// reason to defer removing something that already exists.
const TicketTestCasesSection = forwardRef<TicketTestCasesSectionHandle, TicketTestCasesSectionProps>(
  ({projectId, ticketId}, ref) => {
    const {listTestCases} = useListTestCasesHook();
    const {saveTestCases} = useSaveTestCasesHook();
    const {deleteTestCase} = useDeleteTestCaseHook();

    const [fetched, setFetched] = useState<FetchState | null>(null);
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [persistedIds, setPersistedIds] = useState<Set<string>>(new Set());
    const [activeId, setActiveId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
      let cancelled = false;

      listTestCases(projectId, ticketId).then((result) => {
        if (!cancelled) {
          const loaded = result.success ? result.testCases : [];
          setFetched({id: ticketId, testCases: loaded});
          setTestCases(loaded);
          setPersistedIds(new Set(loaded.map((tc) => tc.id)));
        }
      });

      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps -- listTestCases is a thin useRequestHook wrapper recreated every render
    }, [projectId, ticketId]);

    useImperativeHandle(ref, () => ({
      submit: async () => {
        const result = await saveTestCases(projectId, ticketId, testCases);

        if (result.success) {
          setPersistedIds(new Set(testCases.map((tc) => tc.id)));
        }
      },
    }));

    const loading = fetched?.id !== ticketId;
    const activeTestCase = testCases.find((tc) => tc.id === activeId) ?? testCases[0] ?? null;

    const steps: StepperStep[] = testCases.map((tc, index) => ({
      id: tc.id,
      label: tc.title.trim() || `Test case ${index + 1}`,
    }));

    const updateTestCase = (updated: TestCase) => {
      setTestCases((current) => current.map((tc) => (tc.id === updated.id ? updated : tc)));
    };

    const handleAdd = () => {
      const testCase = createTestCase();
      setTestCases((current) => [...current, testCase]);
      setActiveId(testCase.id);
    };

    const handleRemove = (id: string) => {
      const removeLocally = () => {
        setTestCases((current) => {
          const remaining = current.filter((tc) => tc.id !== id);

          if (activeTestCase?.id === id) {
            setActiveId(remaining[0]?.id ?? null);
          }

          return remaining;
        });
      };

      if (!persistedIds.has(id)) {
        removeLocally();
        return;
      }

      setDeletingId(id);

      deleteTestCase(projectId, ticketId, id)
        .then((result) => {
          if (result.success) {
            removeLocally();
          }
        })
        .finally(() => setDeletingId(null));
    };

    if (loading) {
      return <p className="text-sm text-muted-foreground">Loading test cases…</p>;
    }

    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Test cases</p>
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={handleAdd}>
            Add test case
          </Button>
        </div>

        {testCases.length === 0 ? (
          <p className="text-sm text-muted-foreground">No test cases yet.</p>
        ) : (
          activeTestCase && (
            <div className="flex flex-col gap-4">
              <Stepper steps={steps} activeId={activeTestCase.id} onSelect={setActiveId} className="border-b-0 pb-0" />

              <Surface className="flex flex-col gap-3 p-4">
                <div className="flex items-center gap-3">
                  <Input
                    value={activeTestCase.title}
                    onChange={(e) => updateTestCase({...activeTestCase, title: e.target.value})}
                    className="min-w-0 flex-1"
                  />

                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[activeTestCase.status]}`}>
                    {activeTestCase.status}
                  </span>

                  <Button
                    size="icon"
                    variant="ghost"
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    onClick={() => handleRemove(activeTestCase.id)}
                    loading={deletingId === activeTestCase.id}
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-400"
                  />
                </div>

                {activeTestCase.authorId && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <UserChip userId={activeTestCase.authorId} />
                    {activeTestCase.createdAt && <span>{new Date(activeTestCase.createdAt).toLocaleString()}</span>}
                  </div>
                )}

                <div className="flex flex-col gap-3 border-t border-border pt-3">
                  <div className="flex flex-col gap-2">
                    <p className="text-left text-xs uppercase tracking-widest text-muted-foreground">Steps</p>

                    {activeTestCase.steps.map((step, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={step}
                          onChange={(e) => {
                            const stepsList = [...activeTestCase.steps];
                            stepsList[index] = e.target.value;
                            updateTestCase({...activeTestCase, steps: stepsList});
                          }}
                          placeholder={`Step ${index + 1}`}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          disableRipple
                          onClick={() =>
                            updateTestCase({...activeTestCase, steps: activeTestCase.steps.filter((_, i) => i !== index)})
                          }
                          className="h-6 w-6 min-w-0 shrink-0 rounded-md text-muted-foreground hover:bg-muted hover:text-red-400"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-fit"
                      onClick={() => updateTestCase({...activeTestCase, steps: [...activeTestCase.steps, '']})}
                    >
                      Add step
                    </Button>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <p className="text-left text-xs uppercase tracking-widest text-muted-foreground">Expected result</p>
                    <Textarea
                      value={activeTestCase.expectedResult}
                      onChange={(e) => updateTestCase({...activeTestCase, expectedResult: e.target.value})}
                      rows={2}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <p className="text-left text-xs uppercase tracking-widest text-muted-foreground">Status</p>
                    <Select
                      value={activeTestCase.status}
                      onValueChange={(value) => updateTestCase({...activeTestCase, status: value as TestCaseStatus})}
                      className="w-fit"
                      options={STATUS_OPTIONS}
                    />
                  </div>
                </div>
              </Surface>
            </div>
          )
        )}
      </div>
    );
  },
);

TicketTestCasesSection.displayName = 'TicketTestCasesSection';

export default TicketTestCasesSection;
