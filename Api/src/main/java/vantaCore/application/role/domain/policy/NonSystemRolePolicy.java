package vantaCore.application.role.domain.policy;

import org.springframework.stereotype.Component;
import vantaCore.application.role.domain.RoleAggregate;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.dto.NotificationCollection;
import vantaCore.application.shared.domain.policy.PolicyInterface;

/** Shared by UpdateRoleCommandHandler and DeleteRoleCommandHandler - the built-in system role
 (Administrator) can never be renamed, have its resources changed, or be deleted. */
@Component
final public class NonSystemRolePolicy implements PolicyInterface<RoleAggregate> {

    @Override
    public NotificationCollection check(RoleAggregate role) {
        NotificationCollection notificationCollection = new NotificationCollection();

        if (role.isSystem()) {
            notificationCollection.append(new Notification(
                "system-role-immutable",
                "The built-in Administrator role cannot be changed or deleted",
                true
            ));
        }

        return notificationCollection;
    }
}
