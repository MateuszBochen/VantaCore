package vantaCore.application.role.domain.policy;

import org.springframework.stereotype.Component;
import vantaCore.application.role.domain.specification.UniqueRoleNameSpecification;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.dto.NotificationCollection;
import vantaCore.application.shared.domain.policy.PolicyInterface;

@Component
final public class CreateRolePolicy implements PolicyInterface<String> {

    private final UniqueRoleNameSpecification uniqueRoleNameSpecification;

    public CreateRolePolicy(UniqueRoleNameSpecification uniqueRoleNameSpecification) {
        this.uniqueRoleNameSpecification = uniqueRoleNameSpecification;
    }

    @Override
    public NotificationCollection check(String name) {
        NotificationCollection notificationCollection = new NotificationCollection();

        if (!this.uniqueRoleNameSpecification.isSatisfied(name)) {
            notificationCollection.append(new Notification(
                "role-name-exists",
                "A role with this name already exists",
                true
            ));
        }

        return notificationCollection;
    }
}
