package vantaCore.application.board.domain.policy;

import org.springframework.stereotype.Component;
import vantaCore.application.board.domain.repository.BoardAggregateRepositoryInterface;
import vantaCore.application.board.domain.vo.BoardId;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.dto.NotificationCollection;
import vantaCore.application.shared.domain.policy.PolicyInterface;

@Component
final public class CreateBoardPolicy implements PolicyInterface<BoardId> {

    private final BoardAggregateRepositoryInterface repository;

    public CreateBoardPolicy(BoardAggregateRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public NotificationCollection check(BoardId id) {
        NotificationCollection notificationCollection = new NotificationCollection();

        if (this.repository.existsById(id)) {
            notificationCollection.append(new Notification(
                "board-already-exists",
                "Board with this id already exists",
                true
            ));
        }

        return notificationCollection;
    }
}
