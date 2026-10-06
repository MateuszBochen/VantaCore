package vantaCore.application.board.appliaction.command.updateBoard;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.board.appliaction.dto.CreateBoardRequest;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.BOARD_UPDATE)
final public class UpdateBoardCommand {

    @NotNull
    private final UUID boardId;

    @Valid
    @NotNull
    private final CreateBoardRequest createBoardRequest;

    public UpdateBoardCommand(UUID boardId, CreateBoardRequest createBoardRequest) {
        this.boardId = boardId;
        this.createBoardRequest = createBoardRequest;
    }

    public UUID getBoardId() {
        return boardId;
    }

    public CreateBoardRequest getCreateBoardRequest() {
        return createBoardRequest;
    }
}
