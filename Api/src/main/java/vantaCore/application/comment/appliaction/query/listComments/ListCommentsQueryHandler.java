package vantaCore.application.comment.appliaction.query.listComments;

import org.springframework.stereotype.Component;
import vantaCore.application.comment.domain.CommentAggregate;
import vantaCore.application.comment.domain.CommentSnapshot;
import vantaCore.application.comment.domain.repository.CommentAggregateRepositoryInterface;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.exception.TicketNotFoundException;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;

import java.util.List;

@Component
final public class ListCommentsQueryHandler implements QueryHandlerInterface<ListCommentsQuery, Collection<CommentResult>> {

    private final CommentAggregateRepositoryInterface repository;
    private final ProjectAggregateRepositoryInterface projectRepository;
    private final TicketAggregateRepositoryInterface ticketRepository;

    public ListCommentsQueryHandler(
        CommentAggregateRepositoryInterface repository,
        ProjectAggregateRepositoryInterface projectRepository,
        TicketAggregateRepositoryInterface ticketRepository
    ) {
        this.repository = repository;
        this.projectRepository = projectRepository;
        this.ticketRepository = ticketRepository;
    }

    @Override
    public Collection<CommentResult> handle(ListCommentsQuery query) {
        ProjectId projectId = new ProjectId(query.getProjectId());
        TicketId ticketId = new TicketId(query.getTicketId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);
        this.ticketRepository.findById(ticketId).orElseThrow(TicketNotFoundException::new);

        List<Item<CommentResult>> items = this.repository.findAllByTicketId(ticketId.value()).stream()
            .map(CommentAggregate::toSnapshot)
            .map(this::toItem)
            .toList();

        return new Collection<>(0, items.size(), items.size(), items);
    }

    private Item<CommentResult> toItem(CommentSnapshot snapshot) {
        return Item.fromPayload(snapshot.id().toString(), new CommentResult(
            snapshot.id().value(),
            snapshot.body(),
            snapshot.createdAt(),
            snapshot.changedAt(),
            new CommentActorResult(snapshot.authorId())
        ));
    }
}
