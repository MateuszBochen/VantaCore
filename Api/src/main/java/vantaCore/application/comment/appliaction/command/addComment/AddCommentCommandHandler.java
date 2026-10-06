package vantaCore.application.comment.appliaction.command.addComment;

import org.springframework.stereotype.Component;
import vantaCore.application.comment.appliaction.dto.CommentRequest;
import vantaCore.application.comment.domain.CommentAggregate;
import vantaCore.application.comment.domain.event.CommentWasAdded;
import vantaCore.application.comment.domain.repository.CommentAggregateRepositoryInterface;
import vantaCore.application.comment.domain.vo.CommentId;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.event.EventBusInterface;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.exception.TicketNotFoundException;
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;
import vantaCore.application.ticket.domain.TicketSnapshot;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;
import vantaCore.application.user.domain.vo.UserId;

import java.time.Instant;

@Component
final public class AddCommentCommandHandler implements CommandHandlerInterface<AddCommentCommand> {

    private final ProjectAggregateRepositoryInterface projectRepository;
    private final TicketAggregateRepositoryInterface ticketRepository;
    private final CommentAggregateRepositoryInterface repository;
    private final CurrentUserProviderInterface currentUserProvider;
    private final EventBusInterface eventBus;

    public AddCommentCommandHandler(
        ProjectAggregateRepositoryInterface projectRepository,
        TicketAggregateRepositoryInterface ticketRepository,
        CommentAggregateRepositoryInterface repository,
        CurrentUserProviderInterface currentUserProvider,
        EventBusInterface eventBus
    ) {
        this.projectRepository = projectRepository;
        this.ticketRepository = ticketRepository;
        this.repository = repository;
        this.currentUserProvider = currentUserProvider;
        this.eventBus = eventBus;
    }

    @Override
    public Void handle(AddCommentCommand command) {
        ProjectId projectId = new ProjectId(command.getProjectId());
        TicketId ticketId = new TicketId(command.getTicketId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);
        TicketSnapshot ticket = this.ticketRepository.findById(ticketId)
            .orElseThrow(TicketNotFoundException::new)
            .toSnapshot();

        UserId currentUserId = this.currentUserProvider.getCurrentUserId();
        CommentRequest request = command.getCommentRequest();
        Instant now = Instant.now();

        CommentAggregate comment = CommentAggregate.newComment(
            CommentId.create(),
            ticketId.value(),
            currentUserId.value(),
            request.getBody(),
            now,
            now
        );

        this.repository.save(comment);
        this.eventBus.dispatch(new CommentWasAdded(comment.toSnapshot(), ticket));

        return null;
    }
}
