package vantaCore.application.notification.appliaction.query.listNotifications;

import org.springframework.stereotype.Component;
import vantaCore.application.notification.domain.NotificationAggregate;
import vantaCore.application.notification.domain.repository.NotificationAggregateRepositoryInterface;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;

import java.util.List;
import java.util.UUID;

@Component
final public class ListNotificationsQueryHandler implements QueryHandlerInterface<ListNotificationsQuery, Collection<NotificationResult>> {

    private final NotificationAggregateRepositoryInterface repository;
    private final CurrentUserProviderInterface currentUserProvider;

    public ListNotificationsQueryHandler(
        NotificationAggregateRepositoryInterface repository,
        CurrentUserProviderInterface currentUserProvider
    ) {
        this.repository = repository;
        this.currentUserProvider = currentUserProvider;
    }

    @Override
    public Collection<NotificationResult> handle(ListNotificationsQuery query) {
        UUID currentUserId = this.currentUserProvider.getCurrentUserId().value();

        List<Item<NotificationResult>> items = this.repository.findAllByUserId(currentUserId).stream()
            .map(this::toItem)
            .toList();

        return new Collection<>(0, items.size(), items.size(), items);
    }

    private Item<NotificationResult> toItem(NotificationAggregate notification) {
        return Item.fromPayload(notification.getId().toString(), new NotificationResult(
            notification.getId().value(),
            notification.getType(),
            notification.getPayload(),
            notification.isRead(),
            notification.getCreatedAt()
        ));
    }
}
