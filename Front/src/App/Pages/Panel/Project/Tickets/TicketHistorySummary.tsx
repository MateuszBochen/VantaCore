import {memo} from 'react';
import type {ReactNode} from 'react';
import {UserChip} from '@/components/ui/user-chip';
import {PRIORITIES} from '@/lib/Ticket/Type/types';
import type {TicketVersion} from '@/lib/Ticket/Type/types';
import type {Project} from '@/lib/Project/Type/types';

type TicketHistorySummaryProps = {
  project: Project;
  version: TicketVersion;
};

const FieldLabel = ({children}: {children: ReactNode}) => (
  <p className="text-left text-xs uppercase tracking-widest text-muted-foreground">{children}</p>
);

// Read-only counterpart to TicketSidebar for a historical version - doesn't
// reuse the live sidebar's widgets. Worklog/Children/Related there call
// their own hooks independent of onChange (e.g. the stopwatch's Play/Stop
// still fires real requests against the *current* ticket) so reusing them
// in a "locked" state the way SubProjectDocumentationPage's history viewer
// reuses its editable widgets isn't safe here - this only ever renders
// plain labels, nothing interactive.
const TicketHistorySummary = memo(({project, version}: TicketHistorySummaryProps) => {
  const issueType = project.issueTypes.find((type) => type.id === version.issueTypeId) ?? null;
  const status = project.statuses.find((candidate) => candidate.id === version.statusId) ?? null;
  const subProject = project.subProjects.find((candidate) => candidate.id === version.subProjectId) ?? null;
  const priority = PRIORITIES.find((candidate) => candidate.level === version.priority) ?? null;

  return (
    <div className="flex w-full shrink-0 flex-col gap-5 rounded-2xl border border-border bg-card p-5 lg:w-80">
      <div className="flex flex-col gap-1.5">
        <FieldLabel>Status</FieldLabel>
        <p className="text-sm text-foreground">{status?.name ?? '—'}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Sub-project</FieldLabel>
        <p className="text-sm text-foreground">{subProject?.name ?? 'No sub-project'}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Priority</FieldLabel>
        <p className="text-sm text-foreground">{priority?.name ?? '—'}</p>
      </div>

      {issueType?.estimable && (
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Estimate</FieldLabel>
          <p className="text-sm text-foreground">
            {version.estimate ?? '—'}
            {version.estimate !== null && project.estimateUnit ? ` ${project.estimateUnit}` : ''}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Assignees</FieldLabel>
        {version.assigneeIds.length === 0 ? (
          <p className="text-sm text-muted-foreground">None</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {version.assigneeIds.map((id) => (
              <UserChip key={id} userId={id} />
            ))}
          </div>
        )}
      </div>

      {version.flagIds.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Flags</FieldLabel>
          <div className="flex flex-wrap gap-1.5">
            {version.flagIds.map((id) => {
              const flag = project.flags.find((candidate) => candidate.id === id);

              return flag ? (
                <span
                  key={id}
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{backgroundColor: `${flag.color}33`, color: flag.color}}
                >
                  {flag.name}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}

      {version.tags.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Tags</FieldLabel>
          <div className="flex flex-wrap gap-1.5">
            {version.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

TicketHistorySummary.displayName = 'TicketHistorySummary';

export default TicketHistorySummary;
