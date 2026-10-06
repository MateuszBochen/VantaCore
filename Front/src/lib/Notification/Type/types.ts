import type {CollectionResponse} from '@/lib/Request/Type/types';

// The payload shape depends on `type` and isn't confirmed per-type yet - kept
// as a loose record until the backend nails down what each type carries.
export type NotificationSummary = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: string;
};

export type ListNotificationsResponseItem = {
  id: string;
  resource: NotificationSummary;
};

export type ListNotificationsResponse = CollectionResponse<ListNotificationsResponseItem>;

export type ListNotificationsResult =
  | {success: true; notifications: NotificationSummary[]}
  | {success: false};

export type MarkNotificationReadResult =
  | {success: true}
  | {success: false};

// The real notification `type` values this app actually creates today (see
// describeNotification in UserBadge.tsx) - no backend enum exists to import,
// NotificationSummary.type is a plain string. Kept as its own narrower union
// here since preferences need a closed, pickable list for the UI; a new
// notification type showing up server-side just won't have a tuning row
// until this list is extended to match, same as describeNotification's own
// per-type special-casing already needs updating for a new type today.
export type NotificationEventType = 'TICKET_ASSIGNED' | 'COMMENT_ADDED' | 'MENTIONED_IN_COMMENT';

export type NotificationPreferenceMode = 'REALTIME' | 'DIGEST' | 'MUTED';

// `projectId`/`eventType` null = applies to every project / every event
// type respectively - a preference is an override, not a whitelist: no
// matching row for a given (projectId, eventType) pair means REALTIME,
// today's implicit behavior (see the sub-project's ADR - defaulting
// everything to MUTED would silently hide notifications from someone who
// never opened this screen).
export type NotificationPreference = {
  projectId: string | null;
  eventType: NotificationEventType | null;
  mode: NotificationPreferenceMode;
};

export type NotificationPreferenceResponseItem = {
  id: string;
  resource: NotificationPreference;
};

export type ListNotificationPreferencesResponse = CollectionResponse<NotificationPreferenceResponseItem>;

export type ListNotificationPreferencesResult =
  | {success: true; preferences: NotificationPreference[]}
  | {success: false};

export type SaveNotificationPreferenceResult =
  | {success: true}
  | {success: false};
