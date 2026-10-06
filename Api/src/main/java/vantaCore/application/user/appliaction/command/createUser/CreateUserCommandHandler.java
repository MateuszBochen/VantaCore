package vantaCore.application.user.appliaction.command.createUser;

import org.springframework.stereotype.Component;
import vantaCore.application.role.domain.RoleAggregate;
import vantaCore.application.role.domain.repository.RoleAggregateRepositoryInterface;
import vantaCore.application.role.domain.vo.RoleId;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.exception.RoleNotFoundException;
import vantaCore.application.user.appliaction.dto.CreateUserRequest;
import vantaCore.application.user.domain.UserAggregate;
import vantaCore.application.user.domain.policy.CreateUserPolicy;
import vantaCore.application.user.domain.repository.UserAggregateRepositoryInterface;
import vantaCore.application.user.domain.vo.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
final public class CreateUserCommandHandler implements CommandHandlerInterface<CreateUserCommand> {

    private final CreateUserPolicy createUserPolicy;
    private final UserAggregateRepositoryInterface repository;
    private final RoleAggregateRepositoryInterface roleAggregateRepository;

    public CreateUserCommandHandler(
        CreateUserPolicy createUserPolicy,
        UserAggregateRepositoryInterface repository,
        RoleAggregateRepositoryInterface roleAggregateRepository
    ) {
        this.createUserPolicy = createUserPolicy;
        this.repository = repository;
        this.roleAggregateRepository = roleAggregateRepository;
    }

    @Override
    public Void handle(CreateUserCommand command) {
        CreateUserRequest userData = command.getCreateUserRequest();
        Email userEmail = new Email(userData.getEmail());
        this.createUserPolicy.check(userEmail).assertAllowed();

        Set<RoleId> roleIds = userData.getRoleIds().stream().map(RoleId::new).collect(Collectors.toSet());
        List<RoleAggregate> foundRoles = this.roleAggregateRepository.findAllById(roleIds);
        if (foundRoles.size() != roleIds.size()) {
            throw new RoleNotFoundException();
        }

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
            roleIds
        );

        repository.save(userAggregate);

        return null;
    }
}
