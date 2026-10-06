package vantaCore.application.user.appliaction.command.createAdmin;

import org.springframework.stereotype.Component;
import vantaCore.application.role.domain.repository.RoleAggregateRepositoryInterface;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.user.appliaction.dto.CreateAdminRequest;
import vantaCore.application.user.domain.UserAggregate;
import vantaCore.application.user.domain.policy.CreateAdminPolicy;
import vantaCore.application.user.domain.repository.UserAggregateRepositoryInterface;
import vantaCore.application.user.domain.vo.*;

import java.util.Set;

@Component
final public class CreateAdminCommandHandler implements CommandHandlerInterface<CreateAdminCommand> {

    private final CreateAdminPolicy createAdminPolicy;
    private final UserAggregateRepositoryInterface repository;
    private final RoleAggregateRepositoryInterface roleAggregateRepository;

    public CreateAdminCommandHandler(
        CreateAdminPolicy  createAdminPolicy,
        UserAggregateRepositoryInterface repository,
        RoleAggregateRepositoryInterface roleAggregateRepository
    ) {
        this.createAdminPolicy = createAdminPolicy;
        this.repository = repository;
        this.roleAggregateRepository = roleAggregateRepository;
    }

    @Override
    public Void handle(CreateAdminCommand command) {
        CreateAdminRequest userData = command.getCreateAdminRequest();
        Email userEmail = new Email(userData.getEmail());
        this.createAdminPolicy.check(userEmail).assertAllowed();

        UserAggregate userAggregate = new UserAggregate(
            UserId.create(),
            new UserCredentials(
                userEmail,
                Password.fromRaw(userData.getPassword())
            ),
            new UserProfile(
                userData.getFirstName(),
                userData.getLastName(),
                null
            ),
            Set.of(this.roleAggregateRepository.findSystemRole().getId())
        );

        repository.save(userAggregate);

        return null;
    }
}
