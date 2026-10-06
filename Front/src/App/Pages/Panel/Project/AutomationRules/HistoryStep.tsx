import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {Check, X} from 'lucide-react';
import {LoadMoreButton} from '@/components/ui/load-more-button';
import useListAutomationRuleExecutionsHook from '@/lib/Automation/useListAutomationRuleExecutionsHook';
import {ACTION_TYPE_LABELS, TRIGGER_TYPE_LABELS} from './automationLabels';
import type {AutomationExecution} from '@/lib/Automation/Type/types';

type HistoryStepProps = {
  projectId: string;
  ruleId: string;
};

const LIMIT = 20;

// Only "MATCHED" is confirmed from the real backend response so far - no
// hardcoded status→color map here, color is derived instead from
// errorMessage/executedActions (see statusClass below), which works
// regardless of what the full status enum turns out to be.
const getStatusClass = (execution: AutomationExecution): string => {
  if (execution.errorMessage || execution.executedActions.some((action) => !action.success)) {
    return 'text-destructive';
  }
  if (execution.status === 'MATCHED') {
    return 'text-emerald-400';
  }
  return 'text-muted-foreground';
};

// One row per trigger firing, including ones conditions blocked - "why
// didn't my rule run" is exactly what someone opens this tab to answer, so
// a near-miss is logged, not hidden.
const HistoryStep = ({projectId, ruleId}: HistoryStepProps) => {
  const {listAutomationRuleExecutions} = useListAutomationRuleExecutionsHook();
  const [executions, setExecutions] = useState<AutomationExecution[] | null>(null);
  const [total, setTotal] = useState(0);
  // 0-indexed, same convention as VersionTrackerPage's own list+"Load more".
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;

    listAutomationRuleExecutions(projectId, ruleId, 0, LIMIT).then((result) => {
      if (!cancelled && result.success) {
        setExecutions(result.executions);
        setTotal(result.total);
        setPage(0);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listAutomationRuleExecutions is a thin useRequestHook wrapper recreated every render
  }, [projectId, ruleId]);

  const handleLoadMore = () => {
    setLoadingMore(true);

    listAutomationRuleExecutions(projectId, ruleId, page + 1, LIMIT)
      .then((result) => {
        if (result.success) {
          setExecutions((current) => [...(current ?? []), ...result.executions]);
          setPage((current) => current + 1);
        }
      })
      .finally(() => setLoadingMore(false));
  };

  if (executions === null) {
    return <p className="text-sm text-muted-foreground">Loading history…</p>;
  }

  if (executions.length === 0) {
    return <p className="text-sm text-muted-foreground">This rule hasn't run yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {executions.map((execution) => (
        <div key={execution.id} className="flex flex-col gap-1.5 rounded-xl border border-border bg-card p-3">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-sm font-medium ${getStatusClass(execution)}`}>
              {TRIGGER_TYPE_LABELS[execution.triggerType]} — {execution.status}
              {execution.depth > 0 && ` (depth ${execution.depth})`}
            </span>
            <span className="text-xs text-muted-foreground">{new Date(execution.executedAt).toLocaleString()}</span>
          </div>

          {execution.ticketId && (
            <Link
              to={`/projects/${execution.projectId}/tickets/${execution.ticketId}`}
              className="w-fit text-xs text-accent hover:underline"
            >
              View ticket
            </Link>
          )}

          {execution.errorMessage && <p className="text-xs text-destructive">{execution.errorMessage}</p>}

          {(execution.executedActions ?? []).length > 0 && (
            <div className="flex flex-col gap-1">
              {execution.executedActions.map((result) => (
                <div key={result.actionId} className="flex items-center gap-1.5 text-xs">
                  {result.success ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  ) : (
                    <X className="h-3.5 w-3.5 shrink-0 text-destructive" />
                  )}
                  <span className="text-foreground">{ACTION_TYPE_LABELS[result.type] ?? result.type}</span>
                  {result.error && <span className="text-destructive">— {result.error}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {executions.length < total && (
        <LoadMoreButton loaded={executions.length} total={total} loading={loadingMore} onClick={handleLoadMore} />
      )}
    </div>
  );
};

export default HistoryStep;
