package vantaCore.application.notification.domain.vo;

/** See the "enforced at creation time" ADR - checked by CreateNotificationCommandHandler before a
 notification is ever written, not filtered after the fact. */
public enum NotificationMode {
    REALTIME,
    DIGEST,
    MUTED
}
