import {Avatar} from "./avatar";
import useUsersHook from "@/lib/User/useUsersHook";
import getUserDisplayName from "@/lib/User/getUserDisplayName";
import {cn} from "@/lib/utils";

export type UserChipProps = {
  userId: string;
  className?: string;
};

// Resolves a bare user id - assigneeIds, WorklogEntry.actorId,
// Comment.authorId, Ticket.authorId, every "actor {id}"-shaped API model
// flattens to this once mapped into our domain types - against the same
// user directory the Assignees/Custom Fields pickers use (useUsersHook,
// backed by UsersCache), so every place a user gets shown resolves
// identically and shares one cache instead of each call site re-deriving
// its own name/avatar lookup.
function UserChip({userId, className}: UserChipProps) {
  const {users} = useUsersHook();
  const user = users.find((candidate) => candidate.id === userId);
  // Falls back to a fixed label rather than the id itself when there's
  // nothing to resolve - userId can come back missing/empty if a caller's
  // API data doesn't actually match its assumed shape at runtime (unlike a
  // TS type, that isn't something a bad response gets caught by).
  const name = user ? getUserDisplayName(user) : userId || "Unknown user";

  return (
    <span
      className={cn(
        // Left padding kept small (not px-2 on both sides) - the avatar is
        // already a rounded-full circle nesting inside this pill's own
        // rounded-full left cap, so a symmetric px-2 left a visibly empty
        // gap between the pill's edge and the avatar (reported 2026-08-07).
        "inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/10 py-0.5 pr-2 pl-0.5 text-xs font-medium text-zinc-200",
        className,
      )}
    >
      <Avatar name={name} src={user?.avatarUrl} />
      <span className="truncate">{name}</span>
    </span>
  );
}

export {UserChip};
