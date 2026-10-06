package vantaCore.application.role.appliaction.command.deleteRole;

import org.springframework.stereotype.Component;
import vantaCore.application.role.domain.RoleAggregate;
import vantaCore.application.role.domain.policy.NonSystemRolePolicy;
import vantaCore.application.role.domain.repository.RoleAggregateRepositoryInterface;
import vantaCore.application.role.domain.vo.RoleId;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.exception.RoleNotFoundException;
import vantaCore.application.shared.application.exception.UnprocessableEntityException;
import vantaCore.application.user.domain.repository.UserAggregateRepositoryInterface;

import java.util.List;

@Component
final public class DeleteRoleCommandHandler implements CommandHandlerInterface<DeleteRoleCommand> {

    private final RoleAggregateRepositoryInterface repository;
    private final UserAggregateRepositoryInterface userAggregateRepository;
    private final NonSystemRolePolicy nonSystemRolePolicy;

    public DeleteRoleCommandHandler(
        RoleAggregateRepositoryInterface repository,
        UserAggregateRepositoryInterface userAggregateRepository,
        NonSystemRolePolicy nonSystemRolePolicy
    ) {
        this.repository = repository;
        this.userAggregateRepository = userAggregateRepository;
        this.nonSystemRolePolicy = nonSystemRolePolicy;
    }

    @Override
    public Void handle(DeleteRoleCommand command) {
        RoleId id = new RoleId(command.getRoleId());

        RoleAggregate existing = this.repository.findById(id).orElseThrow(RoleNotFoundException::new);
        this.nonSystemRolePolicy.check(existing).assertAllowed();

        if (this.userAggregateRepository.existsByRoleId(id)) {
            throw new UnprocessableEntityException(List.of(new Notification(
                "role-in-use",
                "This role is still assigned to at least one user",
                true
            )));
        }

        this.repository.deleteById(id);

        return null;
    }
}
