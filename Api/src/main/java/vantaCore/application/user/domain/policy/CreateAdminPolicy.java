package vantaCore.application.user.domain.policy;

import org.springframework.stereotype.Component;
import vantaCore.application.role.domain.repository.RoleAggregateRepositoryInterface;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.dto.NotificationCollection;
import vantaCore.application.shared.domain.policy.PolicyInterface;
import vantaCore.application.user.domain.repository.UserAggregateRepositoryInterface;
import vantaCore.application.user.domain.specification.UniqueEmailSpecification;
import vantaCore.application.user.domain.vo.Email;

@Component
final public class CreateAdminPolicy implements PolicyInterface<Email> {

    private final UserAggregateRepositoryInterface userAggregateRepository;
    private final RoleAggregateRepositoryInterface roleAggregateRepository;
    private final UniqueEmailSpecification uniqueEmailSpecification;

    public  CreateAdminPolicy(
        UserAggregateRepositoryInterface userAggregateRepository,
        RoleAggregateRepositoryInterface roleAggregateRepository,
        UniqueEmailSpecification uniqueEmailSpecification
    ) {
        this.userAggregateRepository = userAggregateRepository;
        this.roleAggregateRepository = roleAggregateRepository;
        this.uniqueEmailSpecification = uniqueEmailSpecification;
    }

    public NotificationCollection check(Email email) {
        NotificationCollection notificationCollection = new NotificationCollection();

        if (!this.uniqueEmailSpecification.isSatisfied(email)) {
            notificationCollection.append(new Notification(
                "user-exist",
               "User with same email address already exist",
               true
            ));
        }

        if (this.userAggregateRepository.existsByRoleId(this.roleAggregateRepository.findSystemRole().getId())) {
            notificationCollection.append(new Notification(
                "admin-user-exist",
                "Admin user already exist",
                true
            ));
        }

        return notificationCollection;
    }
}
