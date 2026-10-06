package vantaCore.application.userSettings.appliaction.query.getOpenSettings;

// Public, pre-login settings (GET /web-api/open-settings, permitAll) - no @RequiresResource and no
// current user, unlike GetAppSettingsQuery. Everything it returns must be safe to show to an
// anonymous visitor - see OpenSettingsResult.
final public class GetOpenSettingsQuery {
}
