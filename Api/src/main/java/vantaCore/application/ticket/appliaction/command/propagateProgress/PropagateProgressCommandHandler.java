package vantaCore.application.ticket.appliaction.command.propagateProgress;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.ticket.domain.TicketAggregate;
import vantaCore.application.ticket.domain.TicketSnapshot;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Recomputes progress for command.getTicketId() and every ancestor above it, one level at a time
 - each level's recompute reads its DIRECT children only (their status if they're leaves, or their
 already-updated progress rollup if they're parents themselves), so walking bottom-up one step at a
 time is always working off already-correct data from the level below (see the class-level
 reasoning in TicketResultAssembler.computeProgress). All ancestors of one ticket share the same
 project (a ticket's parent is always in the same project), so the project lookup happens once, not
 per level. */
@Component
final public class PropagateProgressCommandHandler implements CommandHandlerInterface<PropagateProgressCommand> {

    private final TicketAggregateRepositoryInterface repository;
    private final ProjectAggregateRepositoryInterface projectRepository;

    public PropagateProgressCommandHandler(
        TicketAggregateRepositoryInterface repository,
        ProjectAggregateRepositoryInterface projectRepository
    ) {
        this.repository = repository;
        this.projectRepository = projectRepository;
    }

    @Override
    public Void handle(PropagateProgressCommand command) {
        UUID currentId = command.getTicketId();
        ProjectAggregate project = null;

        while (currentId != null) {
            TicketId current = new TicketId(currentId);
            Optional<TicketAggregate> currentTicket = this.repository.findById(current);

            if (currentTicket.isEmpty()) {
                // Deleted (or never existed) - nothing further up the chain to recompute either,
                // since its own parentId went with it.
                return null;
            }

            TicketSnapshot snapshot = currentTicket.get().toSnapshot();

            if (project == null) {
                project = this.projectRepository.findById(new ProjectId(snapshot.projectId())).orElseThrow(ProjectNotFoundException::new);
            }

            recompute(current, project);

            currentId = snapshot.parentId();
        }

        return null;
    }

    private void recompute(TicketId id, ProjectAggregate project) {
        List<TicketAggregate> children = this.repository.findAllByParentId(id);

        if (children.isEmpty()) {
            // Lost its last child (deleted/reparented away) - back to leaf semantics, see
            // TicketResultAssembler.computeProgress.
            this.repository.updateProgress(id, null);
            return;
        }

        int sum = 0;
        for (TicketAggregate childAggregate : children) {
            TicketSnapshot child = childAggregate.toSnapshot();
            Integer childProgress = this.repository.findRollup(child.id()).progress();
            sum += childProgress != null ? childProgress : (project.isStatusDone(child.statusId()) ? 100 : 0);
        }

        int newProgress = Math.round(sum / (float) children.size());
        this.repository.updateProgress(id, newProgress);
    }
}
