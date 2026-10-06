import {UserAvatarStack} from '@/components/ui/user-avatar-stack';
import {cn} from '@/lib/utils';
import type {Flag} from '@/lib/Project/Type/types';
import type {PriorityDefinition, PriorityLevel} from '@/lib/Ticket/Type/types';

type SprintFilterBarProps = {
  assigneeUserIds: string[];
  selectedUserIds: string[];
  onToggleUser: (userId: string) => void;

  flags: Flag[];
  selectedFlagIds: string[];
  onToggleFlag: (flagId: string) => void;

  tags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;

  priorities: PriorityDefinition[];
  selectedPriorities: PriorityLevel[];
  onTogglePriority: (level: PriorityLevel) => void;
};

// One row above the whole board (see memory: project_vantacore_boards_concept
// - "najlepiej nad całym bordem"), each facet only rendered if there's
// actually something to filter by. Within a facet the semantics are OR
// (matches ANY selected flag), across facets it's AND (SprintBoardPage's own
// filtering logic, not this component) - standard faceted-filter behavior.
// Flags/priority reuse the exact colored-pill convention already used
// elsewhere for them (TicketEditor's flag toggle buttons, TicketIsland's
// flag chips) - `${color}33` background / `${color}` text when active,
// dimmed to `${color}14` / lower opacity when not. Tags have no inherent
// color, so they get a plain accent-token toggle instead (border-accent/
// bg-accent, not a hardcoded hue - adapts to whichever theme's own accent).
const SprintFilterBar = ({
  assigneeUserIds,
  selectedUserIds,
  onToggleUser,
  flags,
  selectedFlagIds,
  onToggleFlag,
  tags,
  selectedTags,
  onToggleTag,
  priorities,
  selectedPriorities,
  onTogglePriority,
}: SprintFilterBarProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <UserAvatarStack userIds={assigneeUserIds} selectedUserIds={selectedUserIds} onToggle={onToggleUser} includeUnassigned />

      {priorities.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {priorities.map((priority) => {
            const selected = selectedPriorities.includes(priority.level);

            return (
              <button
                key={priority.level}
                type="button"
                onClick={() => onTogglePriority(priority.level)}
                className="rounded-full border px-2 py-1 text-xs font-medium transition-opacity"
                style={{
                  backgroundColor: `${priority.color}${selected ? '33' : '14'}`,
                  borderColor: `${priority.color}${selected ? '66' : '22'}`,
                  color: priority.color,
                  opacity: selected ? 1 : 0.6,
                }}
              >
                {priority.name}
              </button>
            );
          })}
        </div>
      )}

      {flags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {flags.map((flag) => {
            const selected = selectedFlagIds.includes(flag.id);

            return (
              <button
                key={flag.id}
                type="button"
                onClick={() => onToggleFlag(flag.id)}
                className="rounded-full border px-2 py-1 text-xs font-medium transition-opacity"
                style={{
                  backgroundColor: `${flag.color}${selected ? '33' : '14'}`,
                  borderColor: `${flag.color}${selected ? '66' : '22'}`,
                  color: flag.color,
                  opacity: selected ? 1 : 0.6,
                }}
              >
                {flag.name}
              </button>
            );
          })}
        </div>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((tag) => {
            const selected = selectedTags.includes(tag);

            return (
              <button
                key={tag}
                type="button"
                onClick={() => onToggleTag(tag)}
                className={cn(
                  'rounded-full border px-2 py-1 text-xs font-medium transition-colors',
                  selected ? 'border-accent/60 bg-accent/20 text-accent' : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/40',
                )}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SprintFilterBar;
