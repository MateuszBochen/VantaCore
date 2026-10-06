package vantaCore.application.ticket.appliaction.query.getTicket;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.exception.TicketNotFoundException;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.ticket.appliaction.query.TicketResultAssembler;
import vantaCore.application.ticket.domain.TicketAggregate;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;
import vantaCore.application.ticket.domain.vo.TicketKey;

import java.util.Optional;
import java.util.UUID;

@Component
final public class GetTicketQueryHandler implements QueryHandlerInterface<GetTicketQuery, Item<GetTicketResult>> {

    private final TicketAggregateRepositoryInterface repository;
    private final ProjectAggregateRepositoryInterface projectRepository;
    private final TicketResultAssembler resultAssembler;

    public GetTicketQueryHandler(
        TicketAggregateRepositoryInterface repository,
        ProjectAggregateRepositoryInterface projectRepository,
        TicketResultAssembler resultAssembler
    ) {
        this.repository = repository;
        this.projectRepository = projectRepository;
        this.resultAssembler = resultAssembler;
    }

    @Override
    public Item<GetTicketResult> handle(GetTicketQuery query) {
        ProjectId projectId = new ProjectId(query.getProjectId());

        ProjectAggregate project = this.projectRepository.findById(projectId)
            .orElseThrow(ProjectNotFoundException::new);

        TicketAggregate ticket = resolveTicket(projectId, query.getTicketIdentifier())
            .orElseThrow(TicketNotFoundException::new);

        GetTicketResult result = this.resultAssembler.toResult(ticket, project);

        return Item.fromPayload(result.id().toString(), result);
    }

    // "VC-1000" isn't parseable as a UUID, so a plain format check is enough to tell the two apart -
    // id lookup is additionally scoped to this project for consistency with the key lookup, which is
    // scoped by construction (findByProjectIdAndKey).
    private Optional<TicketAggregate> resolveTicket(ProjectId projectId, String identifier) {
        try {
            TicketId ticketId = new TicketId(UUID.fromString(identifier));

            return this.repository.findById(ticketId)
                .filter(ticket -> ticket.toSnapshot().projectId().equals(projectId.value()));
        } catch (IllegalArgumentException exception) {
            return this.repository.findByProjectIdAndKey(projectId.value(), new TicketKey(identifier));
        }
    }
}
