package vantaCore.application.board.appliaction.command.createBoard;

import org.springframework.stereotype.Component;
import vantaCore.application.board.appliaction.dto.BoardRequestConverter;
import vantaCore.application.board.appliaction.dto.CreateBoardRequest;
import vantaCore.application.board.domain.BoardAggregate;
import vantaCore.application.board.domain.policy.CreateBoardPolicy;
import vantaCore.application.board.domain.repository.BoardAggregateRepositoryInterface;
import vantaCore.application.board.domain.vo.BoardId;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;

import java.util.UUID;

@Component
final public class CreateBoardCommandHandler implements CommandHandlerInterface<CreateBoardCommand> {

    private final BoardAggregateRepositoryInterface repository;
    private final ProjectAggregateRepositoryInterface projectRepository;
    private final CreateBoardPolicy createBoardPolicy;

    public CreateBoardCommandHandler(
        BoardAggregateRepositoryInterface repository,
        ProjectAggregateRepositoryInterface projectRepository,
        CreateBoardPolicy createBoardPolicy
    ) {
        this.repository = repository;
        this.projectRepository = projectRepository;
        this.createBoardPolicy = createBoardPolicy;
    }

    @Override
    public Void handle(CreateBoardCommand command) {
        CreateBoardRequest request = command.getCreateBoardRequest();
        BoardId id = new BoardId(request.getId());

        this.createBoardPolicy.check(id).assertAllowed();

        for (UUID projectId : BoardRequestConverter.toUuidSet(request.getProjectIds())) {
            this.projectRepository.findById(new ProjectId(projectId)).orElseThrow(ProjectNotFoundException::new);
        }

        BoardAggregate board = BoardAggregate.newBoard(
            id,
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
