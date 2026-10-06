package vantaCore.application.role.appliaction.query.listResources;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.Arrays;
import java.util.List;

/** The resource catalog is defined entirely in code (the Resource enum) - no repository involved,
 this just exposes it so the UI can build a role's "assign resources" checkbox list. */
@Component
final public class ListResourcesQueryHandler implements QueryHandlerInterface<ListResourcesQuery, Collection<ResourceResult>> {

    @Override
    public Collection<ResourceResult> handle(ListResourcesQuery query) {
        List<Item<ResourceResult>> items = Arrays.stream(Resource.values())
            .map(resource -> Item.fromPayload(resource.name(), new ResourceResult(resource.name(), resource.getCode())))
            .toList();

        return new Collection<>(0, items.size(), items.size(), items);
    }
}
