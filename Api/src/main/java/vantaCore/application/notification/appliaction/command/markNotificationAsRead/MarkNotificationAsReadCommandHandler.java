package vantaCore.application.notification.appliaction.command.markNotificationAsRead;

import org.springframework.stereotype.Component;
import vantaCore.application.notification.domain.NotificationAggregate;
import vantaCore.application.notification.domain.repository.NotificationAggregateRepositoryInterface;
import vantaCore.application.notification.domain.vo.NotificationId;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.exception.NotificationNotFoundException;
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;
import vantaCore.application.user.domain.vo.UserId;

@Component
final public class MarkNotificationAsReadCommandHandler implements CommandHandlerInterface<MarkNotificationAsReadCommand> {

    private final NotificationAggregateRepositoryInterface repository;
    private final CurrentUserProviderInterface currentUserProvider;

    public MarkNotificationAsReadCommandHandler(
        NotificationAggregateRepositoryInterface repository,
        CurrentUserProviderInterface currentUserProvider
    ) {
        this.repository = repository;
        this.currentUserProvider = currentUserProvider;
    }

    @Override
    public Void handle(MarkNotificationAsReadCommand command) {
        NotificationId id = new NotificationId(command.getNotificationId());
        UserId currentUserId = this.currentUserProvider.getCurrentUserId();

        NotificationAggregate notification = this.repository.findById(id)
            .orElseThrow(NotificationNotFoundException::new);

        // don't distinguish "doesn't exist" from "isn't yours" in the response - this is a private inbox
        if (!notification.getUserId().equals(currentUserId.value())) {
            throw new NotificationNotFoundException();
        }

        this.repository.save(notification.markAsRead());

        return null;
    }
}
