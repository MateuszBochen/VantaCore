package vantaCore.application.notification.domain.vo;

/** Exactly the 3 values the notification pipeline actually creates today, per the type strings
 CreateNotificationCommand's callers already use (see CreateNotificationWhenNewTicketWasCreated,
 CreateNotificationWhenCommentWasAdded, CreateMentionNotificationWhenCommentWasAdded) - matches
 NotificationTuning's own spec exactly.

 NOTE: there is a 4th notification type in the codebase today, MENTIONED_IN_TICKET (mentions in a
 ticket's description, as opposed to a comment - see CreateMentionNotificationWhenUsersWereMentionedInTicket),
 which is NOT one of these 3 and so has no dedicated per-type preference of its own - it can still be
 muted/digested via a project-wide "all event types" (null eventType) preference, just not targeted
 individually. Flagged as a gap against "matches what the system actually creates" rather than
 silently extending the enum unasked. */
public enum NotificationEventType {
    TICKET_ASSIGNED,
    COMMENT_ADDED,
    MENTIONED_IN_COMMENT;

    /** null for a notification `type` string that isn't one of these 3 (e.g. MENTIONED_IN_TICKET) -
     see class javadoc. */
    public static NotificationEventType fromTypeStringOrNull(String type) {
        try {
            return type == null ? null : NotificationEventType.valueOf(type);
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }
}
