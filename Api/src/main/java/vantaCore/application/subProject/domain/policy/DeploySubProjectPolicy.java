package vantaCore.application.subProject.domain.policy;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.dto.NotificationCollection;
import vantaCore.application.shared.domain.policy.PolicyInterface;
import vantaCore.application.subProject.domain.SubProjectAggregate;
import vantaCore.application.subProject.domain.vo.SubProjectStatus;

@Component
final public class DeploySubProjectPolicy implements PolicyInterface<SubProjectAggregate> {

    @Override
    public NotificationCollection check(SubProjectAggregate subProject) {
        NotificationCollection notifications = new NotificationCollection();

        if (subProject.getStatus() == SubProjectStatus.DEPLOYED) {
            notifications.append(new Notification(
                "sub-project-already-deployed",
                "Sub-project is already deployed",
                true
            ));
        }

        return notifications;
    }
}
