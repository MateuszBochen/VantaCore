package vantaCore.application.role.appliaction.command.createRole;

import org.springframework.stereotype.Component;
import vantaCore.application.role.appliaction.dto.RoleRequest;
import vantaCore.application.role.domain.RoleAggregate;
import vantaCore.application.role.domain.policy.CreateRolePolicy;
import vantaCore.application.role.domain.repository.RoleAggregateRepositoryInterface;
import vantaCore.application.role.domain.vo.RoleId;
import vantaCore.application.shared.application.command.CommandHandlerInterface;

@Component
final public class CreateRoleCommandHandler implements CommandHandlerInterface<CreateRoleCommand> {

    private final RoleAggregateRepositoryInterface repository;
    private final CreateRolePolicy createRolePolicy;

    public CreateRoleCommandHandler(
        RoleAggregateRepositoryInterface repository,
        CreateRolePolicy createRolePolicy
    ) {
        this.repository = repository;
        this.createRolePolicy = createRolePolicy;
    }

    @Override
    public Void handle(CreateRoleCommand command) {
        RoleRequest request = command.getRoleRequest();

        this.createRolePolicy.check(request.getName()).assertAllowed();

        RoleAggregate role = RoleAggregate.create(RoleId.create(), request.getName(), request.getResources());
        this.repository.save(role);

        return null;
    }
}
