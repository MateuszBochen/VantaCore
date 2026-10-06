package vantaCore.application.ticket.appliaction.command.propagateAutomation;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.AutomationRule;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.event.EventBusInterface;
import vantaCore.application.ticket.domain.TicketAggregate;
import vantaCore.application.ticket.domain.TicketSnapshot;
import vantaCore.application.ticket.domain.event.TicketWasChanged;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Runs whenever a ticket newly becomes done (see UpsertTicketCommandHandler). Two independent
 cascades, both recursive:
 - down: every descendant is carried to its own issue type's done status too
 - up: if this now makes ALL of the parent's children done, and the project has an AutomationRule
 configured for the parent's issue type, the parent is set to that rule's status - which can in
 turn complete the grandparent, and so on
 Both directions terminate naturally (no parent / already done / no rule / not all children done /
 no children) - see the early returns below. */
@Component
final public class PropagateAutomationCommandHandler implements CommandHandlerInterface<PropagateAutomationCommand> {

    private final TicketAggregateRepositoryInterface repository;
    private final ProjectAggregateRepositoryInterface projectRepository;
    private final EventBusInterface eventBus;

    public PropagateAutomationCommandHandler(
        TicketAggregateRepositoryInterface repository,
        ProjectAggregateRepositoryInterface projectRepository,
        EventBusInterface eventBus
    ) {
        this.repository = repository;
        this.projectRepository = projectRepository;
        this.eventBus = eventBus;
    }

    @Override
    public Void handle(PropagateAutomationCommand command) {
        propagate(new TicketId(command.getTicketId()));

        return null;
    }

    private void propagate(TicketId ticketId) {
        TicketAggregate ticket = this.repository.findById(ticketId).orElse(null);
        if (ticket == null) {
            return;
        }

        TicketSnapshot snapshot = ticket.toSnapshot();

        ProjectAggregate project = this.projectRepository.findById(new ProjectId(snapshot.projectId())).orElse(null);
        if (project == null || !project.isStatusDone(snapshot.statusId())) {
            return;
        }

        cascadeToChildren(ticketId, project);
        cascadeToParent(snapshot, project);
    }

    private void cascadeToChildren(TicketId ticketId, ProjectAggregate project) {
        for (TicketAggregate child : this.repository.findAllByParentId(ticketId)) {
            TicketSnapshot childSnapshot = child.toSnapshot();

            if (project.isStatusDone(childSnapshot.statusId())) {
                continue;
            }

            Optional<UUID> doneStatusId = project.findDoneStatusId(childSnapshot.issueTypeId());
            if (doneStatusId.isEmpty()) {
                continue;
            }

            TicketAggregate updatedChild = applyStatus(child, doneStatusId.get(), project);
            this.repository.save(updatedChild);
            this.eventBus.dispatch(new TicketWasChanged(updatedChild.toSnapshot()));

            // the child may have its own children
            propagate(childSnapshot.id());
        }
    }

    private void cascadeToParent(TicketSnapshot snapshot, ProjectAggregate project) {
        if (snapshot.parentId() == null) {
            return;
        }

        TicketId parentId = new TicketId(snapshot.parentId());
        TicketAggregate parent = this.repository.findById(parentId).orElse(null);
        if (parent == null) {
            return;
        }

        TicketSnapshot parentSnapshot = parent.toSnapshot();

        if (project.isStatusDone(parentSnapshot.statusId())) {
            return;
        }

        Optional<AutomationRule> rule = project.findAutomationRuleForParentType(parentSnapshot.issueTypeId());
        if (rule.isEmpty()) {
            return;
        }

        List<TicketAggregate> siblings = this.repository.findAllByParentId(parentId);
        boolean allSiblingsDone = !siblings.isEmpty() && siblings.stream()
            .allMatch(sibling -> {
                TicketSnapshot siblingSnapshot = sibling.toSnapshot();
                return project.isStatusDone(siblingSnapshot.statusId());
            });

        if (!allSiblingsDone) {
            return;
        }

        TicketAggregate updatedParent = applyStatus(parent, rule.get().setParentStatusId(), project);
        this.repository.save(updatedParent);
        this.eventBus.dispatch(new TicketWasChanged(updatedParent.toSnapshot()));

        // completing the parent might complete the grandparent's children too
        propagate(parentId);
    }

    private TicketAggregate applyStatus(TicketAggregate ticket, UUID statusId, ProjectAggregate project) {
        return ticket.withStatus(statusId, project.isStatusDone(statusId), Instant.now());
    }
}
