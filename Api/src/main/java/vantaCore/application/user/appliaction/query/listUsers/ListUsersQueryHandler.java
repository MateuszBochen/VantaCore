package vantaCore.application.user.appliaction.query.listUsers;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.user.domain.repository.UserAggregateRepositoryInterface;

import java.util.List;

@Component
final public class ListUsersQueryHandler implements QueryHandlerInterface<ListUsersQuery, Collection<UserSummaryResult>> {

    private final UserAggregateRepositoryInterface repository;

    public ListUsersQueryHandler(UserAggregateRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public Collection<UserSummaryResult> handle(ListUsersQuery query) {
        List<Item<UserSummaryResult>> items = this.repository.findAllSummaries().stream()
            .map(summary -> Item.fromPayload(
                summary.id().toString(),
                new UserSummaryResult(
                    summary.id().value(),
                    summary.firstName(),
                    summary.lastName(),
                    summary.email(),
                    summary.avatarUrl()
                )
            ))
            .toList();

        return new Collection<>(0, items.size(), items.size(), items);
    }
}