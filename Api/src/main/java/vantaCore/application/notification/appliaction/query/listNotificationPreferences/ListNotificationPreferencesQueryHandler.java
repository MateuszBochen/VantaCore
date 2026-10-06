package vantaCore.application.notification.appliaction.query.listNotificationPreferences;

import org.springframework.stereotype.Component;
import vantaCore.application.notification.domain.NotificationPreferenceAggregate;
import vantaCore.application.notification.domain.repository.NotificationPreferenceRepositoryInterface;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;

import java.util.List;
import java.util.UUID;

@Component
final public class ListNotificationPreferencesQueryHandler
    implements QueryHandlerInterface<ListNotificationPreferencesQuery, Collection<NotificationPreferenceResult>> {

    private final NotificationPreferenceRepositoryInterface repository;
    private final CurrentUserProviderInterface currentUserProvider;

    public ListNotificationPreferencesQueryHandler(
        NotificationPreferenceRepositoryInterface repository,
        CurrentUserProviderInterface currentUserProvider
    ) {
        this.repository = repository;
        this.currentUserProvider = currentUserProvider;
    }

    @Override
    public Collection<NotificationPreferenceResult> handle(ListNotificationPreferencesQuery query) {
        UUID currentUserId = this.currentUserProvider.getCurrentUserId().value();

        List<Item<NotificationPreferenceResult>> items = this.repository.findAllByUserId(currentUserId).stream()
            .map(this::toItem)
            .toList();

        return new Collection<>(0, items.size(), items.size(), items);
    }

    private Item<NotificationPreferenceResult> toItem(NotificationPreferenceAggregate preference) {
        NotificationPreferenceResult result = new NotificationPreferenceResult(
            preference.getProjectId(), preference.getEventType(), preference.getMode()
        );

        return Item.fromPayload(preference.getId().toString(), result);
    }
}
