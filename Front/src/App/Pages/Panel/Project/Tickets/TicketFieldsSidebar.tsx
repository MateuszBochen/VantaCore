import {memo, useEffect, useState} from 'react';
import type {ReactNode} from 'react';
import {cn} from '@/lib/utils';
import {Input} from '@/components/ui/input';
import {Select} from '@/components/ui/select';
import {Combobox} from '@/components/ui/combobox';
import {ChipInput} from '@/components/ui/chip-input';
import {UserChip} from '@/components/ui/user-chip';
import useUsersHook from '@/lib/User/useUsersHook';
import getUserDisplayName from '@/lib/User/getUserDisplayName';
import useGetTicketTagsHook from '@/lib/Ticket/useGetTicketTagsHook';
import type {ProjectSprintOption} from '@/lib/Sprint/useListProjectSprintsHook';
import type {SprintStatus} from '@/lib/Sprint/Type/types';
import type {Project, Status} from '@/lib/Project/Type/types';
import {PRIORITIES} from '@/lib/Ticket/Type/types';
import type {Ticket} from '@/lib/Ticket/Type/types';

// "Active"/"Future" isn't visible anywhere else on the ticket - a sprintName
// alone doesn't tell you whether this ticket is in the sprint that's
// actually running right now or one that's merely planned, which is exactly
// the ambiguity this badge (and each option's own suffix below) exists to
// remove.
const SPRINT_STATUS_LABEL: Record<SprintStatus, string> = {
  active: 'Active',
  future: 'Future',
  closed: 'Closed',
};

const SPRINT_STATUS_BADGE_CLASSES: Record<SprintStatus, string> = {
  active: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-400',
  future: 'border-accent/30 bg-accent/10 text-accent',
  closed: 'border-border bg-muted text-muted-foreground',
};

type TicketFieldsSidebarProps = {
  project: Project;
  ticket: Ticket;
  // A patch, not the whole next Ticket - the parent merges it against the
  // LATEST draft via functional setState (see TicketEditor's
  // handleFieldsPatch), not by spreading the `ticket` prop this component
  // was given. That's deliberate: `ticket` here is a memoized snapshot that
  // deliberately goes stale on title/description edits (so this whole face
  // can skip re-rendering while someone types elsewhere), and spreading a
  // stale snapshot back out would silently revert whichever one just changed.
  onChange: (patch: Partial<Ticket>) => void;
  // Fetched by TicketEditor, not here - it also needs this same list at
  // submit time (to resolve a sprint's boardId for the Sprint PATCH), so one
  // shared fetch avoids the dropdown and the submit-time lookup ever disagreeing.
  sprintOptions: ProjectSprintOption[];
};

const FieldLabel = ({children}: {children: ReactNode}) => (
  <p className="text-left text-xs uppercase tracking-widest text-muted-foreground">{children}</p>
);

const TicketFieldsSidebar = memo(({project, ticket, onChange, sprintOptions}: TicketFieldsSidebarProps) => {
  // Issue type itself is picked next to the title (see TicketPage) - it's
  // the one field that gates everything else (status, hierarchy), so it
  // sits above this sidebar rather than inside it.
  const issueType = project.issueTypes.find((type) => type.id === ticket.issueTypeId) ?? null;
  const {users} = useUsersHook();
  const {getTicketTags} = useGetTicketTagsHook();
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    getTicketTags(project.id).then((result) => {
      if (!cancelled && result.success) {
        setTagSuggestions(result.tags);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getTicketTags is a thin useRequestHook wrapper recreated every render
  }, [project.id]);

  // Sprint names aren't guaranteed unique across boards - only disambiguate
  // with the board name in the label when more than one board actually
  // feeds this project (the common case is a single board, where it'd just
  // be noise). Status always shows, though - see SPRINT_STATUS_LABEL's comment.
  const sprintBoardNames = new Set(sprintOptions.map(({boardName}) => boardName));
  const sprintSelectOptions = sprintOptions.map(({sprint, boardName}) => {
    const suffix = sprintBoardNames.size > 1 ? `${boardName}, ${SPRINT_STATUS_LABEL[sprint.status]}` : SPRINT_STATUS_LABEL[sprint.status];
    return {value: sprint.id, label: `${sprint.name} (${suffix})`};
  });

  const selectedSprint = ticket.sprint ? sprintOptions.find(({sprint}) => sprint.id === ticket.sprint!.id)?.sprint : undefined;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <FieldLabel>Status</FieldLabel>
        <Select
          value={ticket.statusId}
          onValueChange={(statusId) => onChange({statusId})}
          disabled={!issueType}
          placeholder={issueType ? 'Select a status…' : 'Pick an issue type first'}
          options={(issueType?.workflow ?? [])
            .map((entry) => project.statuses.find((status) => status.id === entry.statusId))
            .filter((status): status is Status => !!status)
            .map((status) => ({value: status.id, label: status.name}))}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Sub-project</FieldLabel>
        <Select
          value={ticket.subProjectId ?? ''}
          onValueChange={(subProjectId) => onChange({subProjectId: subProjectId === '' ? null : subProjectId})}
          placeholder="No sub-project"
          options={project.subProjects.map((subProject) => ({value: subProject.id, label: subProject.name}))}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <FieldLabel>Sprint</FieldLabel>
          {selectedSprint && (
            <span
              className={cn(
                'rounded-full border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide',
                SPRINT_STATUS_BADGE_CLASSES[selectedSprint.status],
              )}
            >
              {SPRINT_STATUS_LABEL[selectedSprint.status]}
            </span>
          )}
        </div>
        <Select
          value={ticket.sprint?.id ?? ''}
          onValueChange={(sprintId) => {
            const picked = sprintOptions.find(({sprint}) => sprint.id === sprintId);
            onChange({sprint: picked ? {id: picked.sprint.id, sprintName: picked.sprint.name} : null});
          }}
          placeholder="No sprint"
          options={sprintSelectOptions}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Priority</FieldLabel>
        <Select
          value={String(ticket.priority)}
          onValueChange={(value) => onChange({priority: Number(value) as Ticket['priority']})}
          options={PRIORITIES.map((priority) => ({value: String(priority.level), label: priority.name}))}
        />
      </div>

      {issueType?.estimable && (
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Estimate</FieldLabel>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              value={ticket.estimate ?? ''}
              onChange={(e) => onChange({estimate: e.target.value === '' ? null : Number(e.target.value)})}
              placeholder="0"
              className="w-24"
            />
            {project.estimateUnit && <span className="text-sm text-muted-foreground">{project.estimateUnit}</span>}
          </div>
        </div>
      )}

      {ticket.authorId && (
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Author</FieldLabel>
          <UserChip userId={ticket.authorId} />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Assignees</FieldLabel>
        <Combobox
          multiple
          value={ticket.assigneeIds}
          onValueChange={(assigneeIds) => onChange({assigneeIds})}
          placeholder="Search users…"
          options={users.map((user) => ({value: user.id, label: getUserDisplayName(user), avatarUrl: user.avatarUrl}))}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Tags</FieldLabel>
        <ChipInput
          values={ticket.tags}
          onChange={(tags) => onChange({tags})}
          placeholder="Add a tag, Enter or Space to confirm…"
          suggestions={tagSuggestions}
        />
      </div>

      {ticket.progress !== null && (
        <div className="flex flex-col gap-1.5 border-t border-border pt-4">
          <FieldLabel>Progress</FieldLabel>
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-cyan-400" style={{width: `${ticket.progress}%`}} />
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{ticket.progress}%</span>
          </div>
        </div>
      )}
    </div>
  );
});

TicketFieldsSidebar.displayName = 'TicketFieldsSidebar';

export default TicketFieldsSidebar;