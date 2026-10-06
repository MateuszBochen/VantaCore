package vantaCore.application.comment.appliaction.command.deleteComment;

import org.springframework.stereotype.Component;
import vantaCore.application.comment.domain.CommentAggregate;
import vantaCore.application.comment.domain.event.CommentWasDeleted;
import vantaCore.application.comment.domain.policy.CommentAuthorCheck;
import vantaCore.application.comment.domain.policy.CommentAuthorPolicy;
import vantaCore.application.comment.domain.repository.CommentAggregateRepositoryInterface;
import vantaCore.application.comment.domain.vo.CommentId;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.event.EventBusInterface;
import vantaCore.application.shared.application.exception.CommentNotFoundException;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.exception.TicketNotFoundException;
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;
import vantaCore.application.user.domain.vo.UserId;

@Component
final public class DeleteCommentCommandHandler implements CommandHandlerInterface<DeleteCommentCommand> {

    private final ProjectAggregateRepositoryInterface projectRepository;
    private final TicketAggregateRepositoryInterface ticketRepository;
    private final CommentAggregateRepositoryInterface repository;
    private final CurrentUserProviderInterface currentUserProvider;
    private final CommentAuthorPolicy commentAuthorPolicy;
    private final EventBusInterface eventBus;

    public DeleteCommentCommandHandler(
        ProjectAggregateRepositoryInterface projectRepository,
        TicketAggregateRepositoryInterface ticketRepository,
        CommentAggregateRepositoryInterface repository,
        CurrentUserProviderInterface currentUserProvider,
        CommentAuthorPolicy commentAuthorPolicy,
        EventBusInterface eventBus
    ) {
        this.projectRepository = projectRepository;
        this.ticketRepository = ticketRepository;
        this.repository = repository;
        this.currentUserProvider = currentUserProvider;
        this.commentAuthorPolicy = commentAuthorPolicy;
        this.eventBus = eventBus;
    }

    @Override
    public Void handle(DeleteCommentCommand command) {
        ProjectId projectId = new ProjectId(command.getProjectId());
        TicketId ticketId = new TicketId(command.getTicketId());
        CommentId commentId = new CommentId(command.getCommentId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);
        this.ticketRepository.findById(ticketId).orElseThrow(TicketNotFoundException::new);

        CommentAggregate existing = this.repository.findById(commentId)
            .orElseThrow(CommentNotFoundException::new);

        var existingSnapshot = existing.toSnapshot();

        if (!existingSnapshot.ticketId().equals(ticketId.value())) {
            throw new CommentNotFoundException();
        }

        UserId currentUserId = this.currentUserProvider.getCurrentUserId();

        this.commentAuthorPolicy.check(new CommentAuthorCheck(existingSnapshot, currentUserId.value())).assertAllowed();

        this.repository.deleteById(commentId);
        this.eventBus.dispatch(new CommentWasDeleted(ticketId.value(), commentId.value()));

        return null;
    }
}
