package vantaCore.application.sprint.domain.policy;

import org.springframework.stereotype.Component;
import vantaCore.application.board.domain.BoardSnapshot;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.dto.NotificationCollection;
import vantaCore.application.shared.domain.policy.PolicyInterface;
import vantaCore.application.sprint.domain.SprintAggregate;
import vantaCore.application.sprint.domain.SprintSnapshot;
import vantaCore.application.sprint.domain.repository.SprintAggregateRepositoryInterface;
import vantaCore.application.sprint.domain.vo.SprintStatus;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Component
final public class UpsertSprintPolicy implements PolicyInterface<UpsertSprintCheck> {

    private final SprintAggregateRepositoryInterface repository;

    public UpsertSprintPolicy(SprintAggregateRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public NotificationCollection check(UpsertSprintCheck value) {
        NotificationCollection notifications = new NotificationCollection();

        SprintSnapshot sprint = value.sprint().toSnapshot();
        SprintSnapshot existing = value.existing() != null ? value.existing().toSnapshot() : null;

        if (sprint.startDate() != null && sprint.endDate() != null && sprint.startDate().isAfter(sprint.endDate())) {
            notifications.append(new Notification(
                "invalid-sprint-dates",
                "Sprint start date must not be after its end date",
                true
            ));
        }

        if (existing != null && existing.status() == SprintStatus.CLOSED) {
            notifications.append(new Notification(
                "sprint-closed-immutable",
                "A closed sprint can no longer be edited",
                true
            ));
        }

        checkOverlap(sprint, notifications);

        if (existing != null && existing.status() == SprintStatus.ACTIVE) {
            checkActiveSprintTicketChanges(sprint, existing, value.board(), notifications);
        }

        return notifications;
    }

    // Only FUTURE/ACTIVE sprints on the board can collide - a CLOSED sprint is history and doesn't
    // block new planning over the same dates.
    private void checkOverlap(SprintSnapshot sprint, NotificationCollection notifications) {
        if (sprint.startDate() == null || sprint.endDate() == null) {
            return;
        }

        boolean overlaps = this.repository.findAllOpenByBoardIdExcludingId(sprint.boardId(), sprint.id()).stream()
            .map(SprintAggregate::toSnapshot)
            .anyMatch(other -> other.startDate() != null && other.endDate() != null
                && !sprint.startDate().isAfter(other.endDate())
                && !other.startDate().isAfter(sprint.endDate()));

        if (overlaps) {
            notifications.append(new Notification(
                "sprint-dates-overlap",
                "Sprint dates overlap with another sprint on this board",
                true
            ));
        }
    }

    private void checkActiveSprintTicketChanges(
        SprintSnapshot sprint,
        SprintSnapshot existing,
        BoardSnapshot board,
        NotificationCollection notifications
    ) {
        Set<UUID> added = new HashSet<>(sprint.ticketIds());
        added.removeAll(existing.ticketIds());

        Set<UUID> removed = new HashSet<>(existing.ticketIds());
        removed.removeAll(sprint.ticketIds());

        if (!added.isEmpty() && !board.allowAddTicketToActiveSprint()) {
            notifications.append(new Notification(
                "active-sprint-add-ticket-forbidden",
                "This board does not allow adding tickets to an active sprint",
                true
            ));
        }

        if (!removed.isEmpty() && !board.allowRemoveTicketFromActiveSprint()) {
            notifications.append(new Notification(
                "active-sprint-remove-ticket-forbidden",
                "This board does not allow removing tickets from an active sprint",
                true
            ));
        }
    }
}
