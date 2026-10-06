package vantaCore.application.board.appliaction.query.getBoard;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.BOARD_VIEW)
final public class GetBoardQuery {

    @NotNull
    private final UUID boardId;

    public GetBoardQuery(UUID boardId) {
        this.boardId = boardId;
    }

    public UUID getBoardId() {
        return boardId;
    }
}
