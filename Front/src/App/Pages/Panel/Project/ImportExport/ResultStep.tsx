import {Button} from '@/components/ui/button';
import useImportJobPolling from '@/lib/ImportExport/useImportJobPolling';

type ResultStepProps = {
  projectId: string;
  importJobId: string;
  onStartOver: () => void;
};

const OUTCOME_CLASSES: Record<string, string> = {
  CREATED: 'text-emerald-400',
  SKIPPED: 'text-amber-400',
  FAILED: 'text-destructive',
};

const ResultStep = ({projectId, importJobId, onStartOver}: ResultStepProps) => {
  const {job} = useImportJobPolling(projectId, importJobId);

  if (!job || job.status === 'PENDING' || job.status === 'RUNNING') {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{job?.status === 'RUNNING' ? 'Importing…' : 'Starting…'}</p>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-accent transition-all" style={{width: `${job?.progress ?? 0}%`}} />
        </div>
      </div>
    );
  }

  if (job.status === 'FAILED') {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-destructive">The import failed.</p>
        <Button variant="outline" onClick={onStartOver} className="w-fit">
          Start a new import
        </Button>
      </div>
    );
  }

  const report = job.report;

  return (
    <div className="flex flex-col gap-4">
      {report && (
        <div className="flex flex-wrap gap-4">
          <div className="rounded-xl border border-border bg-card px-4 py-2.5">
            <p className="text-xs text-muted-foreground">Created</p>
            <p className="text-lg font-semibold text-emerald-400">{report.createdCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-2.5">
            <p className="text-xs text-muted-foreground">Skipped</p>
            <p className="text-lg font-semibold text-amber-400">{report.skippedCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-2.5">
            <p className="text-xs text-muted-foreground">Failed</p>
            <p className="text-lg font-semibold text-destructive">{report.failedCount}</p>
          </div>
          {report.skippedAttachmentsCount > 0 && (
            <div className="rounded-xl border border-border bg-card px-4 py-2.5">
              <p className="text-xs text-muted-foreground">Attachments skipped (too large)</p>
              <p className="text-lg font-semibold text-amber-400">{report.skippedAttachmentsCount}</p>
            </div>
          )}
        </div>
      )}

      {report && report.rows.length > 0 && (
        <div className="flex flex-col divide-y divide-border overflow-y-auto rounded-xl border border-border">
          {report.rows.map((row) => (
            <div key={row.rowNumber} className="flex items-center gap-3 px-4 py-2 text-sm">
              <span className="w-12 shrink-0 text-xs text-muted-foreground">Row {row.rowNumber}</span>
              <span className={`w-20 shrink-0 text-xs font-semibold ${OUTCOME_CLASSES[row.outcome]}`}>{row.outcome}</span>
              {row.ticketKey && <span className="shrink-0 text-xs text-muted-foreground">{row.ticketKey}</span>}
              {row.message && <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{row.message}</span>}
            </div>
          ))}
        </div>
      )}

      <Button variant="outline" onClick={onStartOver} className="w-fit">
        Start a new import
      </Button>
    </div>
  );
};

export default ResultStep;
