package vantaCore.application.role.appliaction.query.listRoles;

import org.springframework.stereotype.Component;
import vantaCore.application.role.domain.repository.RoleAggregateRepositoryInterface;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;

import java.util.List;

@Component
final public class ListRolesQueryHandler implements QueryHandlerInterface<ListRolesQuery, Collection<RoleSummaryResult>> {

    private final RoleAggregateRepositoryInterface repository;

    public ListRolesQueryHandler(RoleAggregateRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public Collection<RoleSummaryResult> handle(ListRolesQuery query) {
        List<Item<RoleSummaryResult>> items = this.repository.findAll().stream()
            .map(role -> Item.fromPayload(
                role.getId().toString(),
                new RoleSummaryResult(role.getId().value(), role.getName(), role.isSystem(), role.getResources())
            ))
            .toList();

        return new Collection<>(0, items.size(), items.size(), items);
    }
}
