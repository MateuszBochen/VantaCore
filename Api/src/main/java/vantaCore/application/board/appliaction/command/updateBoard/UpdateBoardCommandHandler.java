package vantaCore.application.board.appliaction.command.updateBoard;

import org.springframework.stereotype.Component;
import vantaCore.application.board.appliaction.dto.BoardRequestConverter;
import vantaCore.application.board.appliaction.dto.CreateBoardRequest;
import vantaCore.application.board.domain.BoardAggregate;
import vantaCore.application.board.domain.repository.BoardAggregateRepositoryInterface;
import vantaCore.application.board.domain.vo.BoardId;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.exception.BoardNotFoundException;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;

import java.util.UUID;

@Component
final public class UpdateBoardCommandHandler implements CommandHandlerInterface<UpdateBoardCommand> {

    private final BoardAggregateRepositoryInterface repository;
    private final ProjectAggregateRepositoryInterface projectRepository;

    public UpdateBoardCommandHandler(
        BoardAggregateRepositoryInterface repository,
        ProjectAggregateRepositoryInterface projectRepository
    ) {
        this.repository = repository;
        this.projectRepository = projectRepository;
    }

    @Override
    public Void handle(UpdateBoardCommand command) {
        CreateBoardRequest request = command.getCreateBoardRequest();
        BoardId id = new BoardId(command.getBoardId());

        BoardAggregate existing = this.repository.findById(id).orElseThrow(BoardNotFoundException::new);

        for (UUID projectId : BoardRequestConverter.toUuidSet(request.getProjectIds())) {
            this.projectRepository.findById(new ProjectId(projectId)).orElseThrow(ProjectNotFoundException::new);
        }

        BoardAggregate board = existing.changeBoard(
            request.getName(),
            BoardRequestConverter.toUuidSet(request.getProjectIds()),
            BoardRequestConverter.toColumns(request.getColumns()),
            request.isAllowEditTicketInActiveSprint(),
            request.isAllowChangeEstimateInActiveSprint(),
            request.isAllowAddTicketToActiveSprint(),
            request.isAllowRemoveTicketFromActiveSprint()
        );

        this.repository.save(board);

        return null;
    }
}
