package vantaCore.application.role.appliaction.command.updateRole;

import org.springframework.stereotype.Component;
import vantaCore.application.role.appliaction.dto.RoleRequest;
import vantaCore.application.role.domain.RoleAggregate;
import vantaCore.application.role.domain.policy.NonSystemRolePolicy;
import vantaCore.application.role.domain.repository.RoleAggregateRepositoryInterface;
import vantaCore.application.role.domain.vo.RoleId;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.exception.RoleNotFoundException;
import vantaCore.application.shared.application.exception.UnprocessableEntityException;

import java.util.List;
import java.util.Optional;

@Component
final public class UpdateRoleCommandHandler implements CommandHandlerInterface<UpdateRoleCommand> {

    private final RoleAggregateRepositoryInterface repository;
    private final NonSystemRolePolicy nonSystemRolePolicy;

    public UpdateRoleCommandHandler(
        RoleAggregateRepositoryInterface repository,
        NonSystemRolePolicy nonSystemRolePolicy
    ) {
        this.repository = repository;
        this.nonSystemRolePolicy = nonSystemRolePolicy;
    }

    @Override
    public Void handle(UpdateRoleCommand command) {
        RoleRequest request = command.getRoleRequest();
        RoleId id = new RoleId(command.getRoleId());

        RoleAggregate existing = this.repository.findById(id).orElseThrow(RoleNotFoundException::new);
        this.nonSystemRolePolicy.check(existing).assertAllowed();

        Optional<RoleAggregate> sameName = this.repository.findByName(request.getName());
        if (sameName.isPresent() && !sameName.get().getId().equals(id)) {
            throw new UnprocessableEntityException(List.of(new Notification(
                "role-name-exists",
                "A role with this name already exists",
                true
            )));
        }

        RoleAggregate role = existing.changeRole(request.getName(), request.getResources());
        this.repository.save(role);

        return null;
    }
}
