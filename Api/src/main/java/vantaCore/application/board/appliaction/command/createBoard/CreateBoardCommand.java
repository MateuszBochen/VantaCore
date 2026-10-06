package vantaCore.application.board.appliaction.command.createBoard;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.board.appliaction.dto.CreateBoardRequest;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

@RequiresResource(Resource.BOARD_CREATE)
final public class CreateBoardCommand {

    @Valid
    @NotNull
    private final CreateBoardRequest createBoardRequest;

    public CreateBoardCommand(CreateBoardRequest createBoardRequest) {
        this.createBoardRequest = createBoardRequest;
    }

    public CreateBoardRequest getCreateBoardRequest() {
        return createBoardRequest;
    }
}
