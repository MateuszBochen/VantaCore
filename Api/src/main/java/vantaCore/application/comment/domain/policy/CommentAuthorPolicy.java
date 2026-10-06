package vantaCore.application.comment.domain.policy;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.dto.NotificationCollection;
import vantaCore.application.shared.domain.policy.PolicyInterface;

@Component
final public class CommentAuthorPolicy implements PolicyInterface<CommentAuthorCheck> {

    @Override
    public NotificationCollection check(CommentAuthorCheck value) {
        NotificationCollection notificationCollection = new NotificationCollection();

        if (!value.comment().authorId().equals(value.currentUserId())) {
            notificationCollection.append(new Notification(
                "comment-author-only",
                "Only the comment's author can do this",
                true
            ));
        }

        return notificationCollection;
    }
}
