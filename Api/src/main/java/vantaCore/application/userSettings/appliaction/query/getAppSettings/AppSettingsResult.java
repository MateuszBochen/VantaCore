package vantaCore.application.userSettings.appliaction.query.getAppSettings;

import java.util.Map;

/** userSettings is exactly the same blob GET /api/user-settings returns on its own - see
 UserSettingsController's javadoc for why THAT endpoint stays a bare object while this one uses the
 app's normal {id, type, resource} envelope. No app-wide fields exist yet (version/feature flags/
 limits) - add them here as plain fields when a concrete need shows up, this record is the only
 place that would need to change. */
public record AppSettingsResult(Map<String, Object> userSettings) {
}
