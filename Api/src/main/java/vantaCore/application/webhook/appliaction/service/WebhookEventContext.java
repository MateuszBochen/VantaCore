package vantaCore.application.webhook.appliaction.service;

import vantaCore.application.webhook.domain.vo.WebhookEventType;

import java.time.Instant;
import java.util.UUID;

/** Everything WebhookPayloadFormatter needs to render either the GENERIC JSON envelope or a
 provider-formatted chat message, for one dispatched event. eventType is null for the synthetic
 delivery fired by POST .../webhook/{id}/test (see WebhookDeliveryService.deliverTest) - every
 other field beyond projectId/summary/occurredAt is nullable too, populated only for the event
 kinds that actually carry it (previousStatusId only for TICKET_STATUS_CHANGED, fieldId only for
 TICKET_FIELD_CHANGED, commentBody only for COMMENT_ADDED). */
public record WebhookEventContext(
    WebhookEventType eventType,
    UUID projectId,
    UUID ticketId,
    String ticketKey,
    String ticketTitle,
    UUID statusId,
    UUID previousStatusId,
    String fieldId,
    String commentBody,
    String summary,
    Instant occurredAt
) {
}
