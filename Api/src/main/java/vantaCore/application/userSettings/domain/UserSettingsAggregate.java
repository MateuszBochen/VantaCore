package vantaCore.application.userSettings.domain;

import java.util.Map;
import java.util.UUID;

/** One opaque JSON blob per user (pageTheme, ticketLayout, ...) - deliberately untyped (Map, not a
 set of named fields) since the backend has no opinion on which keys exist or their shape; that
 validation/typing lives entirely in the frontend (see PUT /api/user-settings' contract). No
 changeX() mutator, same "upserts are full replacements" precedent as NotificationPreferenceAggregate -
 a save always replaces the whole blob, never merges into what's already stored. */
public class UserSettingsAggregate {
    private final UUID userId;
    private final Map<String, Object> settings;

    private UserSettingsAggregate(UUID userId, Map<String, Object> settings) {
        this.userId = userId;
        this.settings = settings == null ? Map.of() : Map.copyOf(settings);
    }

    public static UserSettingsAggregate of(UUID userId, Map<String, Object> settings) {
        return new UserSettingsAggregate(userId, settings);
    }

    public UUID getUserId() {
        return userId;
    }

    public Map<String, Object> getSettings() {
        return settings;
    }
}
