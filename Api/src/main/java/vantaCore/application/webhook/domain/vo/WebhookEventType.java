package vantaCore.application.webhook.domain.vo;

/** Deliberately its own enum, not a reuse of automationEngine.TriggerType - same values, same
 underlying domain event bus per the sub-project's own ADR ("one more consumer of the existing
 domain event bus"), but reusing TriggerType directly would create an unwanted cross-module
 dependency from webhook into automationEngine's internals (see NotificationEventType for the same
 precedent). */
public enum WebhookEventType {
    TICKET_CREATED,
    TICKET_STATUS_CHANGED,
    TICKET_FIELD_CHANGED,
    COMMENT_ADDED,
    // Git/VCS events - delivered per ticket the commit/branch/PR references, off the same domain
    // event bus (vcs.domain.event.*). Payload carries ticketId + a human-readable summary; the
    // per-ticket key/title fields stay null for these (not loaded).
    COMMIT_PUSHED,
    BRANCH_CREATED,
    PULL_REQUEST_OPENED,
    PULL_REQUEST_MERGED,
    PULL_REQUEST_DECLINED
}
