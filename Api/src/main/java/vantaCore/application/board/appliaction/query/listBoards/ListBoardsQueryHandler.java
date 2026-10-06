package vantaCore.application.board.appliaction.query.listBoards;

import org.springframework.stereotype.Component;
import vantaCore.application.board.domain.repository.BoardAggregateRepositoryInterface;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;

import java.util.List;

@Component
final public class ListBoardsQueryHandler implements QueryHandlerInterface<ListBoardsQuery, Collection<BoardSummaryResult>> {

    private final BoardAggregateRepositoryInterface repository;

    public ListBoardsQueryHandler(BoardAggregateRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public Collection<BoardSummaryResult> handle(ListBoardsQuery query) {
        List<Item<BoardSummaryResult>> items = this.repository.findAllSummaries().stream()
            .map(summary -> Item.fromPayload(
                summary.id().toString(),
                new BoardSummaryResult(summary.id().value(), summary.name())
            ))
            .toList();

        return new Collection<>(0, items.size(), items.size(), items);
    }
}
