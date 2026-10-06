package vantaCore.application.user.appliaction.command.assignRoles;

import org.springframework.stereotype.Component;
import vantaCore.application.role.domain.RoleAggregate;
import vantaCore.application.role.domain.repository.RoleAggregateRepositoryInterface;
import vantaCore.application.role.domain.vo.RoleId;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.exception.RoleNotFoundException;
import vantaCore.application.user.appliaction.dto.AssignRolesToUserRequest;
import vantaCore.application.user.domain.UserAggregate;
import vantaCore.application.user.domain.repository.UserAggregateRepositoryInterface;
import vantaCore.application.user.domain.vo.UserId;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
final public class AssignRolesToUserCommandHandler implements CommandHandlerInterface<AssignRolesToUserCommand> {

    private final UserAggregateRepositoryInterface repository;
    private final RoleAggregateRepositoryInterface roleAggregateRepository;

    public AssignRolesToUserCommandHandler(
        UserAggregateRepositoryInterface repository,
        RoleAggregateRepositoryInterface roleAggregateRepository
    ) {
        this.repository = repository;
        this.roleAggregateRepository = roleAggregateRepository;
    }

    @Override
    public Void handle(AssignRolesToUserCommand command) {
        AssignRolesToUserRequest request = command.getAssignRolesToUserRequest();
        UserAggregate existing = this.repository.findById(new UserId(command.getUserId()));

        Set<RoleId> roleIds = request.getRoleIds().stream().map(RoleId::new).collect(Collectors.toSet());
        List<RoleAggregate> foundRoles = this.roleAggregateRepository.findAllById(roleIds);
        if (foundRoles.size() != roleIds.size()) {
            throw new RoleNotFoundException();
        }

        UserAggregate user = new UserAggregate(
            existing.getId(),
            existing.getCredentials(),
            existing.getProfile(),
            roleIds
        );

        this.repository.save(user);

        return null;
    }
}
