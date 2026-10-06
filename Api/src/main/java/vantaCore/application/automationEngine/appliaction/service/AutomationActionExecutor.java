package vantaCore.application.automationEngine.appliaction.service;

import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import vantaCore.application.automationEngine.domain.vo.AutomationAction;
import vantaCore.application.comment.appliaction.command.addComment.AddCommentCommand;
import vantaCore.application.comment.appliaction.dto.CommentRequest;
import vantaCore.application.notification.appliaction.command.createNotification.CreateNotificationCommand;
import vantaCore.application.release.appliaction.command.assignTicketToReleaseVersion.AssignTicketToReleaseVersionCommand;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.ticket.appliaction.command.upsertTicket.UpsertTicketCommand;
import vantaCore.application.ticket.appliaction.dto.RelatedTicketRequest;
import vantaCore.application.ticket.appliaction.dto.UpsertTicketRequest;
import vantaCore.application.ticket.domain.TicketSnapshot;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;
import vantaCore.application.ticket.domain.vo.TicketRelation;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** One executor method per ActionType, dispatched via CommandBusInterface through the SAME command
 each action type's normal write path already uses (UpsertTicketCommand for
 SET_STATUS/ASSIGN_USER/SET_FIELD_VALUE, AddCommentCommand for ADD_COMMENT) - so ticket history,
 estimate propagation, search indexing, WS broadcast, mention detection etc. all still fire exactly
 as they would for a human's edit, nothing is bypassed by acting through automation instead.

 The ticket is re-loaded fresh from the repository immediately before each action, not passed in
 from the triggering event - if a rule (or an earlier action in this same rule) already changed the
 ticket, the next action must act on that new state, not a stale snapshot from when the trigger
 first fired. */
@Component
public class AutomationActionExecutor {

    private static final String AUTOMATION_NOTIFICATION_TYPE = "AUTOMATION_RULE_NOTIFICATION";

    private final CommandBusInterface commandBus;
    private final TicketAggregateRepositoryInterface ticketRepository;

    // @Lazy: this bean sits behind EventBus's constructor-collected EventHandlerInterface list
    // (via AutomationRuleEngine <- RunAutomationRulesWhenXxx), and CommandBus's own
    // constructor-collected CommandHandlerInterface list includes handlers (e.g.
    // UpsertTicketCommandHandler) that need EventBusInterface - eagerly resolving CommandBus here
    // would close that construction-time cycle, same reasoning as every other event-reacting
    // handler in this codebase that dispatches commands (CreateNotificationWhenCommentWasAdded, ...).
    public AutomationActionExecutor(@Lazy CommandBusInterface commandBus, TicketAggregateRepositoryInterface ticketRepository) {
        this.commandBus = commandBus;
        this.ticketRepository = ticketRepository;
    }

    public void execute(AutomationAction action, UUID projectId, UUID ticketId) throws Exception {
        switch (action.type()) {
            case SET_STATUS -> setStatus(action, projectId, ticketId);
            case ASSIGN_USER -> assignUser(action, projectId, ticketId);
            case ADD_COMMENT -> addComment(action, projectId, ticketId);
            case SET_FIELD_VALUE -> setFieldValue(action, projectId, ticketId);
            case SEND_NOTIFICATION -> sendNotification(action, ticketId);
            case ASSIGN_NEXT_VERSION -> assignNextVersion(projectId, ticketId);
        }
    }

    private void setStatus(AutomationAction action, UUID projectId, UUID ticketId) throws Exception {
        UUID statusId = requireParamAsUuid(action, "statusId");
        TicketSnapshot ticket = loadTicket(ticketId);

        updateTicket(projectId, ticket, ticket.assigneeIds(), statusId, ticket.customFields());
    }

    // Replaces the ticket's assignees with exactly this one user, rather than adding to the
    // existing set - matches the singular "assign user" naming (an assignment, not an addition).
    private void assignUser(AutomationAction action, UUID projectId, UUID ticketId) throws Exception {
        UUID userId = requireParamAsUuid(action, "userId");
        TicketSnapshot ticket = loadTicket(ticketId);

        updateTicket(projectId, ticket, Set.of(userId), ticket.statusId(), ticket.customFields());
    }

    private void addComment(AutomationAction action, UUID projectId, UUID ticketId) throws Exception {
        String body = requireParam(action, "body");

        this.commandBus.handle(new AddCommentCommand(projectId, ticketId, new CommentRequest(body)));
    }

    private void setFieldValue(AutomationAction action, UUID projectId, UUID ticketId) throws Exception {
        String fieldId = requireParam(action, "fieldId");
        String value = action.params().get("value");
        TicketSnapshot ticket = loadTicket(ticketId);

        Map<String, Object> customFields = new LinkedHashMap<>(ticket.customFields());
        customFields.put(fieldId, value);

        updateTicket(projectId, ticket, ticket.assigneeIds(), ticket.statusId(), customFields);
    }

    // Recipients = the ticket's current assignees - params only carry {message}, no explicit
    // recipient, so this mirrors the existing TICKET_ASSIGNED notification's targeting rather than
    // inventing a new recipient concept. A no-op (not an error) if the ticket has no assignees.
    private void sendNotification(AutomationAction action, UUID ticketId) throws Exception {
        String message = requireParam(action, "message");
        TicketSnapshot ticket = loadTicket(ticketId);

        for (UUID recipientId : ticket.assigneeIds()) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("ticketId", ticket.id().value());
            payload.put("ticketKey", ticket.key().value());
            payload.put("projectId", ticket.projectId());
            payload.put("message", message);

            this.commandBus.handle(new CreateNotificationCommand(recipientId, AUTOMATION_NOTIFICATION_TYPE, payload));
        }
    }

    private void assignNextVersion(UUID projectId, UUID ticketId) throws Exception {
        this.commandBus.handle(new AssignTicketToReleaseVersionCommand(projectId, ticketId));
    }

    private TicketSnapshot loadTicket(UUID ticketId) {
        return this.ticketRepository.findById(new TicketId(ticketId))
            .orElseThrow(() -> new IllegalStateException("Ticket " + ticketId + " not found for automation action"))
            .toSnapshot();
    }

    private void updateTicket(
        UUID projectId,
        TicketSnapshot ticket,
        Set<UUID> assigneeIds,
        UUID statusId,
        Map<String, Object> customFields
    ) throws Exception {
        UpsertTicketRequest request = new UpsertTicketRequest(
            ticket.subProjectId(),
            ticket.issueTypeId(),
            statusId,
            ticket.parentId(),
            ticket.title(),
            ticket.description(),
            ticket.priority(),
            ticket.estimate(),
            List.copyOf(assigneeIds),
            List.copyOf(ticket.flagIds()),
            List.copyOf(ticket.tags()),
            customFields,
            toRelatedTicketRequests(ticket.relatedTickets())
        );

        this.commandBus.handle(new UpsertTicketCommand(projectId, ticket.id().value(), request));
    }

    private List<RelatedTicketRequest> toRelatedTicketRequests(Set<TicketRelation> relations) {
        return relations.stream()
            .map(relation -> new RelatedTicketRequest(relation.relatedTicketId(), relation.type()))
            .toList();
    }

    private String requireParam(AutomationAction action, String key) {
        String value = action.params().get(key);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Action " + action.type() + " is missing required param '" + key + "'");
        }
        return value;
    }

    private UUID requireParamAsUuid(AutomationAction action, String key) {
        try {
            return UUID.fromString(requireParam(action, key));
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("Action " + action.type() + "'s param '" + key + "' is not a valid id");
        }
    }
}
