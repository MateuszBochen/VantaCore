package vantaCore.application.userSettings.appliaction.command.saveUserSettings;

import jakarta.validation.constraints.NotNull;

import java.util.Map;

// Self-scoped to the caller (userId comes from the JWT, never the body) - no @RequiresResource,
// same "not a resource" precedent as the notification module's own preferences. settings is
// deliberately an untyped Map, not a validated request DTO - see UserSettingsAggregate's javadoc
// for why the backend has no opinion on which keys exist or their shape.
final public class SaveUserSettingsCommand {

    @NotNull
    private final Map<String, Object> settings;

    public SaveUserSettingsCommand(Map<String, Object> settings) {
        this.settings = settings;
    }

    public Map<String, Object> getSettings() {
        return settings;
    }
}
