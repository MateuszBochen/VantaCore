package vantaCore.application.ticket.domain.policy;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.dto.NotificationCollection;
import vantaCore.application.shared.domain.policy.PolicyInterface;
import vantaCore.application.ticket.domain.TicketSnapshot;

import java.util.Objects;

@Component
final public class TicketAgainstActiveSprintPolicy implements PolicyInterface<TicketAgainstActiveSprintCheck> {

    @Override
    public NotificationCollection check(TicketAgainstActiveSprintCheck value) {
        NotificationCollection notifications = new NotificationCollection();

        TicketSnapshot previous = value.previous();
        TicketSnapshot updated = value.updated();

        if (previous.estimate() != updated.estimate() && !value.board().allowChangeEstimateInActiveSprint()) {
            notifications.append(new Notification(
                "active-sprint-estimate-change-forbidden",
                "This board does not allow changing estimates on tickets in an active sprint",
                true
            ));
        }

        if (otherFieldsChanged(previous, updated) && !value.board().allowEditTicketInActiveSprint()) {
            notifications.append(new Notification(
                "active-sprint-ticket-edit-forbidden",
                "This board does not allow editing tickets in an active sprint",
                true
            ));
        }

        return notifications;
    }

    // Only scope-defining fields are gated: which sub-project it belongs to, its issue type, and its
    // core content (title/description). Everything else - statusId, parentId, priority, assigneeIds,
    // flagIds, tags, customFields, relatedTickets - is metadata that doesn't affect what was
    // committed to the sprint, so it stays editable regardless of allowEditTicketInActiveSprint.
    private boolean otherFieldsChanged(TicketSnapshot previous, TicketSnapshot updated) {
        return !Objects.equals(previous.subProjectId(), updated.subProjectId())
            || !Objects.equals(previous.issueTypeId(), updated.issueTypeId())
            || !Objects.equals(previous.title(), updated.title())
            || !Objects.equals(previous.description(), updated.description());
    }
}
