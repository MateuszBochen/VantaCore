package vantaCore.application.project.domain.event;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/** A project settings save flipped some statuses' isDone flag. Tickets sitting in those statuses
 became done/not-done WITHOUT any ticket being edited, so whatever is derived from "is this ticket
 done" has to catch up: the ticket module's doneAt (SyncDoneAtWhenProjectStatusDoneFlagWasChanged)
 and active sprints' actual estimate/burndown (RecalculateActiveSprintsWhenProjectStatusDoneFlagWasChanged). */
public record ProjectStatusDoneFlagWasChanged(
    UUID projectId,
    Set<UUID> becameDoneStatusIds,
    Set<UUID> becameNotDoneStatusIds
) {
    public ProjectStatusDoneFlagWasChanged {
        becameDoneStatusIds = Set.copyOf(becameDoneStatusIds);
        becameNotDoneStatusIds = Set.copyOf(becameNotDoneStatusIds);
    }

    public Set<UUID> allChangedStatusIds() {
        return Stream.concat(becameDoneStatusIds.stream(), becameNotDoneStatusIds.stream())
            .collect(Collectors.toUnmodifiableSet());
    }
}
