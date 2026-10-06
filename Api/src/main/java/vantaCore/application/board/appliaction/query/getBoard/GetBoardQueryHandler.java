package vantaCore.application.board.appliaction.query.getBoard;

import org.springframework.stereotype.Component;
import vantaCore.application.board.domain.BoardSnapshot;
import vantaCore.application.board.domain.repository.BoardAggregateRepositoryInterface;
import vantaCore.application.board.domain.vo.BoardId;
import vantaCore.application.board.domain.vo.Column;
import vantaCore.application.shared.application.exception.BoardNotFoundException;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;

@Component
final public class GetBoardQueryHandler implements QueryHandlerInterface<GetBoardQuery, Item<BoardResult>> {

    private final BoardAggregateRepositoryInterface repository;

    public GetBoardQueryHandler(BoardAggregateRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public Item<BoardResult> handle(GetBoardQuery query) {
        BoardId id = new BoardId(query.getBoardId());

        BoardSnapshot board = this.repository.findById(id)
            .orElseThrow(BoardNotFoundException::new)
            .toSnapshot();

        return Item.fromPayload(id.toString(), toResult(board));
    }

    private BoardResult toResult(BoardSnapshot board) {
        return new BoardResult(
            board.id().value(),
            board.name(),
            board.projectIds(),
            board.columns().stream().map(this::toColumnResult).toList(),
            board.allowEditTicketInActiveSprint(),
            board.allowChangeEstimateInActiveSprint(),
            board.allowAddTicketToActiveSprint(),
            board.allowRemoveTicketFromActiveSprint()
        );
    }

    private ColumnResult toColumnResult(Column column) {
        return new ColumnResult(
            column.id(),
            column.name(),
            column.color(),
            column.statusIds()
        );
    }
}
