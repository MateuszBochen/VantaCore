package vantaCore.application.notification.appliaction.query.listNotificationPreferences;

// Self-scoped to the caller via CurrentUserProviderInterface, same as ListNotificationsQuery -
// no @RequiresResource, matching the notification module's existing "not a resource, always
// self-scoped" precedent (see Resource.java's own comment on notification:*).
final public class ListNotificationPreferencesQuery {
}
