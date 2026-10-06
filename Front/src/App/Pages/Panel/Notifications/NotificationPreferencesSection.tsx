import {useEffect, useState} from 'react';
import {Select} from '@/components/ui/select';
import useListProjectsHook from '@/lib/Project/useListProjectsHook';
import useListNotificationPreferencesHook from '@/lib/Notification/useListNotificationPreferencesHook';
import useSaveNotificationPreferenceHook from '@/lib/Notification/useSaveNotificationPreferenceHook';
import type {NotificationEventType, NotificationPreference, NotificationPreferenceMode} from '@/lib/Notification/Type/types';
import type {ProjectSummary} from '@/lib/Project/Type/types';

const MODE_OPTIONS: {value: NotificationPreferenceMode; label: string}[] = [
  {value: 'REALTIME', label: 'Realtime'},
  {value: 'DIGEST', label: 'Digest'},
  {value: 'MUTED', label: 'Muted'},
];

// Every notification `type` this app actually creates today (see
// describeNotification in UserBadge.tsx), plus a leading "All event types"
// row (eventType: null) - covers both of the sub-project's "In scope" cases
// with the same UI: setting only that row to Muted is the per-project mute,
// setting an individual row below it is the per-event-type mode.
const EVENT_TYPE_ROWS: {value: NotificationEventType | null; label: string}[] = [
  {value: null, label: 'All event types'},
  {value: 'TICKET_ASSIGNED', label: 'Ticket assigned to you'},
  {value: 'COMMENT_ADDED', label: 'New comment'},
  {value: 'MENTIONED_IN_COMMENT', label: 'Mentioned in a comment'},
];

// Select's own convention treats value="" as "nothing picked" (shows the
// placeholder, offers no clear button). "All projects" is a real, valid,
// default scope here though - not an unselected state - so it needs its own
// sentinel distinct from "".
const ALL_PROJECTS_VALUE = '__all_projects__';

const preferenceKey = (projectId: string | null, eventType: NotificationEventType | null): string =>
  `${projectId ?? ''}:${eventType ?? ''}`;

// Embedded as a step on ProfilePage (not its own routed page) - notification
// preferences are per-user, same tier as the avatar section right next to
// it, not a destination worth a standalone link off the profile.
const NotificationPreferencesSection = () => {
  const {listProjects} = useListProjectsHook();
  const {listNotificationPreferences} = useListNotificationPreferencesHook();
  const {saveNotificationPreference} = useSaveNotificationPreferenceHook();

  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreference[] | null>(null);
  const [scopeProjectId, setScopeProjectId] = useState(ALL_PROJECTS_VALUE);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    listProjects().then((result) => {
      if (result.success) {
        setProjects(result.projects);
      }
    });

    listNotificationPreferences().then((result) => {
      if (result.success) {
        setPreferences(result.preferences);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot fetch on mount, listProjects/listNotificationPreferences are thin useRequestHook wrappers recreated every render
  }, []);

  const loading = projects === null || preferences === null;

  // Falls back to the sentinel if the Select's own clear button ever fires
  // (onValueChange("")) - "All projects" is this picker's natural empty
  // state anyway, so a stray clear should land right back on it, not on an
  // invalid empty projectId.
  const normalizedScope = scopeProjectId || ALL_PROJECTS_VALUE;
  const effectiveProjectId = normalizedScope === ALL_PROJECTS_VALUE ? null : normalizedScope;

  const scopeOptions = [
    {value: ALL_PROJECTS_VALUE, label: 'All projects'},
    ...(projects ?? []).map((project) => ({value: project.id, label: project.name})),
  ];

  const resolveMode = (eventType: NotificationEventType | null): NotificationPreferenceMode =>
    preferences?.find((preference) => preference.projectId === effectiveProjectId && preference.eventType === eventType)?.mode ??
    'REALTIME';

  const handleModeChange = (eventType: NotificationEventType | null, mode: NotificationPreferenceMode) => {
    const key = preferenceKey(effectiveProjectId, eventType);
    const preference: NotificationPreference = {projectId: effectiveProjectId, eventType, mode};

    setSavingKey(key);

    saveNotificationPreference(preference)
      .then((result) => {
        if (!result.success) {
          return;
        }

        setPreferences((current) => [
          ...(current ?? []).filter((candidate) => preferenceKey(candidate.projectId, candidate.eventType) !== key),
          preference,
        ]);
      })
      .finally(() => setSavingKey(null));
  };

  return (
    <div className="flex max-w-md flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Choose how often you hear about things, per project. Anything you haven{"'"}t tuned stays Realtime — today{"'"}s default.
      </p>

      <div className="flex max-w-xs flex-col gap-1.5">
        <label className="text-xs text-muted-foreground">Project</label>
        <Select value={normalizedScope} onValueChange={setScopeProjectId} options={scopeOptions} />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
          {EVENT_TYPE_ROWS.map((row) => {
            const key = preferenceKey(effectiveProjectId, row.value);

            return (
              <div key={key} className="flex items-center gap-3 px-4 py-2.5">
                <span className="flex-1 text-sm text-foreground">{row.label}</span>
                {savingKey === key && <span className="text-xs text-muted-foreground">Saving…</span>}
                <Select
                  className="w-40"
                  value={resolveMode(row.value)}
                  onValueChange={(value) => handleModeChange(row.value, value as NotificationPreferenceMode)}
                  options={MODE_OPTIONS}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationPreferencesSection;
