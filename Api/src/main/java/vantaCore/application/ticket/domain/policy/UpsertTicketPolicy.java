package vantaCore.application.ticket.domain.policy;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.project.domain.vo.Flag;
import vantaCore.application.project.domain.vo.IssueType;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.dto.NotificationCollection;
import vantaCore.application.shared.domain.policy.PolicyInterface;
import vantaCore.application.ticket.domain.TicketSnapshot;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
final public class UpsertTicketPolicy implements PolicyInterface<TicketAgainstProjectCheck> {

    @Override
    public NotificationCollection check(TicketAgainstProjectCheck value) {
        TicketSnapshot ticket = value.ticket().toSnapshot();
        ProjectAggregate project = value.project();

        NotificationCollection notificationCollection = new NotificationCollection();

        Optional<IssueType> issueType = project.getIssueTypes().stream()
            .filter(type -> type.id().equals(ticket.issueTypeId()))
            .findFirst();

        if (issueType.isEmpty()) {
            notificationCollection.append(new Notification(
                "invalid-issue-type",
                "Ticket references an issue type that does not belong to this project",
                true
            ));
        } else if (ticket.statusId() != null) {
            boolean statusBelongsToIssueType = issueType.get().workflow().stream()
                .anyMatch(step -> step.statusId().equals(ticket.statusId()));

            if (!statusBelongsToIssueType) {
                notificationCollection.append(new Notification(
                    "invalid-status",
                    "Ticket status does not belong to its issue type",
                    true
                ));
            }
        }

        Set<UUID> flagIds = project.getFlags().stream().map(Flag::id).collect(Collectors.toSet());

        for (UUID flagId : ticket.flagIds()) {
            if (!flagIds.contains(flagId)) {
                notificationCollection.append(new Notification(
                    "invalid-flag",
                    "Ticket references a flag that does not belong to this project",
                    true
                ));
            }
        }

        return notificationCollection;
    }
}
