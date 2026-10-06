package vantaCore.application.user.domain.policy;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.dto.NotificationCollection;
import vantaCore.application.shared.domain.policy.PolicyInterface;
import vantaCore.application.user.domain.specification.UniqueEmailSpecification;
import vantaCore.application.user.domain.vo.Email;

@Component
final public class CreateUserPolicy implements PolicyInterface<Email> {

    private final UniqueEmailSpecification uniqueEmailSpecification;

    public CreateUserPolicy(UniqueEmailSpecification uniqueEmailSpecification) {
        this.uniqueEmailSpecification = uniqueEmailSpecification;
    }

    @Override
    public NotificationCollection check(Email email) {
        NotificationCollection notificationCollection = new NotificationCollection();

        if (!this.uniqueEmailSpecification.isSatisfied(email)) {
            notificationCollection.append(new Notification(
                "user-exist",
                "User with same email address already exist",
                true
            ));
        }

        return notificationCollection;
    }
}
