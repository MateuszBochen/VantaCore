package vantaCore.application.ticket.appliaction.query.bulkUpdateTickets;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.exception.ClientException;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.exception.TicketNotFoundException;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.ticket.appliaction.command.deleteTicket.DeleteTicketCommand;
import vantaCore.application.ticket.appliaction.command.upsertTicket.UpsertTicketCommand;
import vantaCore.application.ticket.appliaction.dto.BulkActionRequest;
import vantaCore.application.ticket.appliaction.dto.BulkActionType;
import vantaCore.application.ticket.appliaction.dto.RelatedTicketRequest;
import vantaCore.application.ticket.appliaction.dto.UpsertTicketRequest;
import vantaCore.application.ticket.domain.TicketSnapshot;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;
import vantaCore.application.ticket.domain.vo.TicketRelation;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/** Loops ticketIds and, per the Bulk Operations ADR, dispatches the EXACT same command a
 single-ticket edit/delete would (UpsertTicketCommand / DeleteTicketCommand) - no parallel
 bulk-only validation path, so a batch can never do something a single edit wouldn't allow. Each
 ticket's outcome is caught and recorded independently; one ticket failing never stops the rest of
 the batch. */
@Component
final public class BulkUpdateTicketsQueryHandler implements QueryHandlerInterface<BulkUpdateTicketsQuery, Item<BulkTicketActionResult>> {

    private final ProjectAggregateRepositoryInterface projectRepository;
    private final TicketAggregateRepositoryInterface ticketRepository;
    private final CommandBusInterface commandBus;

    public BulkUpdateTicketsQueryHandler(
        ProjectAggregateRepositoryInterface projectRepository,
        TicketAggregateRepositoryInterface ticketRepository,
        CommandBusInterface commandBus
    ) {
        this.projectRepository = projectRepository;
        this.ticketRepository = ticketRepository;
        this.commandBus = commandBus;
    }

    @Override
    public Item<BulkTicketActionResult> handle(BulkUpdateTicketsQuery query) {
        ProjectId projectId = new ProjectId(query.getProjectId());
        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);

        BulkActionRequest action = query.getBulkTicketActionRequest().getAction();

        List<UUID> ticketIds = query.getBulkTicketActionRequest().getTicketIds();

        // Deleting a ticket now deletes its whole subtree (see DeleteTicketCommandHandler), so a
        // selected child can already be gone by the time its own turn comes, taken down with a
        // selected ancestor processed earlier. Remembering what existed up front lets that case
        // count as the success it is, while an id that never existed still reports not-found.
        Set<UUID> existedBefore = action.getType() == BulkActionType.DELETE
            ? ticketIds.stream()
                .filter(id -> this.ticketRepository.findById(new TicketId(id)).isPresent())
                .collect(Collectors.toSet())
            : Set.of();

        List<BulkTicketActionItemResult> results = ticketIds.stream()
            .map(ticketId -> applyAction(projectId.value(), ticketId, action, existedBefore))
            .toList();

        BulkTicketActionResult result = new BulkTicketActionResult(results);

        return Item.fromPayload(UUID.randomUUID().toString(), result);
    }

    private String messageOf(ClientException exception) {
        return exception.getNotifications().stream()
            .map(Notification::message)
            .reduce((first, second) -> first + "; " + second)
            .orElse(exception.getMessage());
    }

    private BulkTicketActionItemResult applyAction(UUID projectId, UUID ticketId, BulkActionRequest action, Set<UUID> existedBefore) {
        try {
            if (action.getType() == BulkActionType.DELETE) {
                this.commandBus.handle(new DeleteTicketCommand(projectId, ticketId));
            } else {
                this.commandBus.handle(new UpsertTicketCommand(projectId, ticketId, buildUpsertRequest(ticketId, action)));
            }

            return new BulkTicketActionItemResult(ticketId, true, null);
        } catch (TicketNotFoundException exception) {
            if (existedBefore.contains(ticketId)) {
                return new BulkTicketActionItemResult(ticketId, true, null);
            }
            return new BulkTicketActionItemResult(ticketId, false, messageOf(exception));
        } catch (ClientException exception) {
            // The same notification a single-ticket PUT/DELETE would surface (validation, board
            // rules, not-found, permission, ...) - the ADR's whole point is that bulk can't hide or
            // relax what a single edit enforces, so the per-item error text is that same message,
            // not a bulk-specific one.
            return new BulkTicketActionItemResult(ticketId, false, messageOf(exception));
        } catch (Exception exception) {
            return new BulkTicketActionItemResult(ticketId, false, exception.getMessage());
        }
    }

    private UpsertTicketRequest buildUpsertRequest(UUID ticketId, BulkActionRequest action) {
        TicketSnapshot ticket = this.ticketRepository.findById(new TicketId(ticketId))
            .orElseThrow(TicketNotFoundException::new)
            .toSnapshot();

        UUID statusId = ticket.statusId();
        UUID subProjectId = ticket.subProjectId();
        Set<UUID> assigneeIds = ticket.assigneeIds();
        Set<UUID> flagIds = new LinkedHashSet<>(ticket.flagIds());
        Map<String, Object> customFields = ticket.customFields();

        switch (action.getType()) {
            case SET_STATUS -> statusId = requireParamAsUuid(action, "statusId");
            case ASSIGN -> assigneeIds = Set.of(requireParamAsUuid(action, "userId"));
            case SET_FIELD -> {
                String fieldId = requireParam(action, "fieldId");
                customFields = new LinkedHashMap<>(customFields);
                customFields.put(fieldId, action.getParams().get("value"));
            }
            case ADD_FLAG -> flagIds.add(requireParamAsUuid(action, "flagId"));
            case REMOVE_FLAG -> flagIds.remove(requireParamAsUuid(action, "flagId"));
            case MOVE_SUB_PROJECT -> subProjectId = requireParamAsUuid(action, "subProjectId");
            case DELETE -> throw new IllegalStateException("DELETE doesn't build an UpsertTicketRequest");
        }

        return new UpsertTicketRequest(
            subProjectId,
            ticket.issueTypeId(),
            statusId,
            ticket.parentId(),
            ticket.title(),
            ticket.description(),
            ticket.priority(),
            ticket.estimate(),
            List.copyOf(assigneeIds),
            List.copyOf(flagIds),
            List.copyOf(ticket.tags()),
            customFields,
            toRelatedTicketRequests(ticket.relatedTickets())
        );
    }

    private List<RelatedTicketRequest> toRelatedTicketRequests(Set<TicketRelation> relations) {
        return relations.stream()
            .map(relation -> new RelatedTicketRequest(relation.relatedTicketId(), relation.type()))
            .toList();
    }

    private String requireParam(BulkActionRequest action, String key) {
        String value = action.getParams() == null ? null : action.getParams().get(key);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Action " + action.getType() + " is missing required param '" + key + "'");
        }
        return value;
    }

    private UUID requireParamAsUuid(BulkActionRequest action, String key) {
        try {
            return UUID.fromString(requireParam(action, key));
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("Action " + action.getType() + "'s param '" + key + "' is not a valid id");
        }
    }
}
