package vantaCore.application.ticket.appliaction.query.listTicketTags;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;

import java.util.List;

@Component
final public class ListTicketTagsQueryHandler implements QueryHandlerInterface<ListTicketTagsQuery, Item<List<String>>> {

    private final TicketAggregateRepositoryInterface repository;

    public ListTicketTagsQueryHandler(TicketAggregateRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public Item<List<String>> handle(ListTicketTagsQuery query) {
        List<String> tags = this.repository.findAllDistinctTags(query.getProjectId());

        return Item.fromPayload(query.getProjectId().toString(), tags);
    }
}
