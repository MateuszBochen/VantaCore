package vantaCore.application.webhook.appliaction.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;
import vantaCore.application.webhook.domain.vo.WebhookTargetType;

/** GENERIC gets the full structured event envelope (every field WebhookEventContext carries,
 signed with the subscription's own HMAC secret) - SLACK/TEAMS/DISCORD each get that same
 information collapsed into one human-readable line, formatted as that provider's own incoming-
 webhook message shape, since a chat channel is a notification surface, not a data feed. */
@Component
public class WebhookPayloadFormatter {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public String genericBody(String eventTypeLabel, WebhookEventContext context) {
        ObjectNode node = this.objectMapper.createObjectNode();
        node.put("eventType", eventTypeLabel);
        node.put("projectId", string(context.projectId()));
        node.put("ticketId", string(context.ticketId()));
        node.put("ticketKey", context.ticketKey());
        node.put("ticketTitle", context.ticketTitle());
        node.put("statusId", string(context.statusId()));
        node.put("previousStatusId", string(context.previousStatusId()));
        node.put("fieldId", context.fieldId());
        node.put("commentBody", context.commentBody());
        node.put("summary", context.summary());
        node.put("occurredAt", context.occurredAt() == null ? null : context.occurredAt().toString());

        try {
            return this.objectMapper.writeValueAsString(node);
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to serialize webhook payload", exception);
        }
    }

    public String providerBody(WebhookTargetType targetType, String eventTypeLabel, WebhookEventContext context) {
        String message = message(eventTypeLabel, context);

        try {
            return switch (targetType) {
                case SLACK -> this.objectMapper.writeValueAsString(this.objectMapper.createObjectNode().put("text", message));
                case DISCORD -> this.objectMapper.writeValueAsString(this.objectMapper.createObjectNode().put("content", message));
                case TEAMS -> {
                    ObjectNode node = this.objectMapper.createObjectNode();
                    node.put("@type", "MessageCard");
                    node.put("@context", "http://schema.org/extensions");
                    node.put("summary", "VantaCore notification");
                    node.put("text", message);
                    yield this.objectMapper.writeValueAsString(node);
                }
                case GENERIC -> throw new IllegalArgumentException("GENERIC uses genericBody(), not providerBody()");
            };
        } catch (com.fasterxml.jackson.core.JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize webhook payload", exception);
        }
    }

    private String message(String eventTypeLabel, WebhookEventContext context) {
        if (context.summary() != null) {
            return context.summary();
        }

        return switch (eventTypeLabel) {
            case "TICKET_CREATED" -> "Ticket created: %s %s".formatted(context.ticketKey(), context.ticketTitle());
            case "TICKET_STATUS_CHANGED" -> "Ticket %s status changed: %s -> %s"
                .formatted(context.ticketKey(), string(context.previousStatusId()), string(context.statusId()));
            case "TICKET_FIELD_CHANGED" -> "Ticket %s field changed: %s".formatted(context.ticketKey(), context.fieldId());
            case "COMMENT_ADDED" -> "New comment on %s: %s".formatted(context.ticketKey(), context.commentBody());
            default -> "VantaCore event: " + eventTypeLabel;
        };
    }

    private String string(Object value) {
        return value == null ? null : value.toString();
    }
}
