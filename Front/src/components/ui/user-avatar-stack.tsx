import {useState} from 'react';
import {UserX} from 'lucide-react';
import {Avatar} from './avatar';
import useUsersHook from '@/lib/User/useUsersHook';
import getUserDisplayName from '@/lib/User/getUserDisplayName';
import {cn} from '@/lib/utils';

// Sentinel id for the "Unassigned" pseudo-entry - not a real user, so it's
// never resolved through useUsersHook. Exported so a caller's filtering
// logic can check for it (e.g. `ticket.assigneeIds.length === 0`).
export const UNASSIGNED_USER_ID = '__unassigned';

export type UserAvatarStackProps = {
  userIds: string[];
  selectedUserIds: string[];
  onToggle: (userId: string) => void;
  // Prepends a fixed "Unassigned" entry (dashed-outline icon instead of a
  // real avatar) as the first item, for filtering to tickets with nobody
  // assigned - a real user id can never collide with UNASSIGNED_USER_ID.
  includeUnassigned?: boolean;
  className?: string;
};

const AVATAR_SIZE = 28; // px, matches h-7/w-7
const STEP = 18; // px between each entry's left edge - AVATAR_SIZE minus a 10px overlap
const LABEL_GAP = 6; // px between avatar and name once expanded
const LABEL_WIDTH = 140; // px, the expanded name's own width

// A "who's assigned" filter selector - avatars overlap in a tight stack at
// rest (only the circles show). Stacking order is left-to-right (entry 1
// sits under 2, 2 under 3, ...), and exactly ONE entry is ever "expanded"
// (full avatar + name showing) at a time: the LAST one by default, or
// whichever is currently hovered - hovering a different one collapses the
// default back down, it doesn't just add a second expanded entry. Clicking
// toggles that user as an active filter (cyan ring for selected).
//
// Entries are absolutely positioned (not normal flow + negative margins)
// specifically so an EARLIER entry expanding doesn't push everything after
// it sideways - it stays put at its own slot and grows OVER whatever's
// positioned next to it (bumped z-index + a solid background while
// expanded), which is what "nachodzi na następny" (overlaps onto the next
// one) asks for. Which entry is expanded is JS state (onMouseEnter/
// onMouseLeave), not CSS :hover/group-hover - plain CSS can't make a
// DIFFERENT sibling un-expand just because this one is being hovered.
//
// Both the button's own width and the label's width are driven by inline
// `style`, not a Tailwind `max-w-*` utility class - a shrink-to-fit
// (auto-width) flex container isn't reliably guaranteed to animate smoothly
// alongside a transitioning child's width across browsers/engines, so this
// spells out an explicit pixel value for both ends of the transition
// instead of leaning on that implicit behavior (found 2026-08-06: the
// max-w-* version stopped visibly animating once entries switched to
// position: absolute).
//
// The real bug behind "nothing ever animates" (2026-08-06, found after two
// CSS-only fixes made zero difference - the actual state wasn't changing at
// all): the default-expanded LAST entry sits at z-index 50 and is ~174px
// wide, which geometrically covers several EARLIER entries' 28px slots -
// with the whole button as the hit-test target, that wide invisible hitbox
// silently swallowed hover/click events meant for whatever avatar was
// underneath it, so hovering an "earlier" avatar never actually fired
// onMouseEnter at all. Fix: the button itself is `pointer-events-none`
// unconditionally; only the actual avatar circle (or the Unassigned icon)
// re-enables hit-testing via `pointer-events-auto`. A click/hover on the
// wide label/background portion of an expanded neighbor now passes straight
// through to whatever avatar is actually underneath it, exactly like the
// visual overlap implies it should.
function UserAvatarStack({userIds, selectedUserIds, onToggle, includeUnassigned, className}: UserAvatarStackProps) {
  const {users} = useUsersHook();
  const entries = includeUnassigned ? [UNASSIGNED_USER_ID, ...userIds] : userIds;
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (entries.length === 0) {
    return null;
  }

  const expandedId = hoveredId ?? entries[entries.length - 1];
  const rowWidth = STEP * (entries.length - 1) + AVATAR_SIZE + LABEL_GAP + LABEL_WIDTH;

  // Every color below is a theme token (bg-muted/text-foreground/
  // border-accent/...), not a hardcoded zinc/white/cyan value - this was
  // originally built dark-theme-only (white/5, zinc-200, cyan-400, ...),
  // which read as nearly invisible in the light theme (real user feedback +
  // screenshot: white/5 background and zinc-200 text on a light page is
  // barely-there contrast).
  return (
    <div className={cn('inline-flex items-center rounded-full border border-border bg-muted/60 py-1 pr-3 pl-1', className)}>
      <div className="relative h-7" style={{width: rowWidth}}>
        {entries.map((userId, index) => {
          const isUnassigned = userId === UNASSIGNED_USER_ID;
          const user = isUnassigned ? null : users.find((candidate) => candidate.id === userId);
          const name = isUnassigned ? 'Unassigned' : user ? getUserDisplayName(user) : 'Unknown user';
          const selected = selectedUserIds.includes(userId);
          const isExpanded = userId === expandedId;

          return (
            <button
              key={userId}
              type="button"
              onClick={() => onToggle(userId)}
              onMouseEnter={() => setHoveredId(userId)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                left: index * STEP,
                zIndex: isExpanded ? 50 : index + 1,
                width: isExpanded ? AVATAR_SIZE + LABEL_GAP + LABEL_WIDTH : AVATAR_SIZE,
                transition: 'width 200ms ease-out, background-color 200ms ease-out, box-shadow 200ms ease-out',
              }}
              className={cn(
                'pointer-events-none absolute top-0 flex items-center rounded-full',
                isExpanded && 'border border-border bg-popover shadow-md shadow-black/20 backdrop-blur-md',
              )}
            >
              {isUnassigned ? (
                <span
                  className={cn(
                    'pointer-events-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-dashed bg-muted text-muted-foreground transition-colors duration-200',
                    selected ? 'border-accent text-accent' : isExpanded ? 'border-muted-foreground/60' : 'border-muted-foreground/40',
                  )}
                >
                  <UserX className="h-3.5 w-3.5" />
                </span>
              ) : (
                <Avatar
                  name={name}
                  src={user?.avatarUrl}
                  className={cn(
                    'pointer-events-auto h-7 w-7 shrink-0 border-2 transition-colors duration-200',
                    selected ? 'border-accent' : isExpanded ? 'border-border' : 'border-card',
                  )}
                />
              )}

              <span
                className={cn('overflow-hidden text-xs font-medium whitespace-nowrap text-foreground', isExpanded && 'pointer-events-auto')}
                style={{
                  width: isExpanded ? LABEL_WIDTH : 0,
                  opacity: isExpanded ? 1 : 0,
                  marginLeft: isExpanded ? LABEL_GAP : 0,
                  transition: 'width 200ms ease-out, opacity 200ms ease-out, margin-left 200ms ease-out',
                }}
              >
                {name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export {UserAvatarStack};
