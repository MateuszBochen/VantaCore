package vantaCore.application.notification.appliaction.query.listNotificationPreferences;

import vantaCore.application.notification.domain.vo.NotificationEventType;
import vantaCore.application.notification.domain.vo.NotificationMode;

import java.util.UUID;

public record NotificationPreferenceResult(UUID projectId, NotificationEventType eventType, NotificationMode mode) {
}
