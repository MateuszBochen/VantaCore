package vantaCore.application.userSettings.appliaction.query.getAppSettings;

// Self-scoped (embeds the caller's own userSettings blob) - no @RequiresResource, same "not a
// resource" precedent as GetUserSettingsQuery. App-wide fields (version/feature flags/limits, none
// exist yet - see AppSettingsResult) would sit alongside userSettings here once they do, so the
// frontend can bootstrap everything it needs in one call instead of two.
final public class GetAppSettingsQuery {
}
