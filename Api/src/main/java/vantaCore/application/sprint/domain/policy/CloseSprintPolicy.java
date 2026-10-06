package vantaCore.application.sprint.domain.policy;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.dto.NotificationCollection;
import vantaCore.application.shared.domain.policy.PolicyInterface;
import vantaCore.application.sprint.domain.SprintAggregate;
import vantaCore.application.sprint.domain.SprintSnapshot;
import vantaCore.application.sprint.domain.vo.SprintStatus;

@Component
final public class CloseSprintPolicy implements PolicyInterface<SprintAggregate> {

    @Override
    public NotificationCollection check(SprintAggregate value) {
        NotificationCollection notifications = new NotificationCollection();
        SprintSnapshot sprint = value.toSnapshot();

        if (sprint.status() != SprintStatus.ACTIVE) {
            notifications.append(new Notification(
                "sprint-not-closable",
                "Only an active sprint can be closed",
                true
            ));
        }

        return notifications;
    }
}
