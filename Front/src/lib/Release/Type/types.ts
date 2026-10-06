import type {TicketSummary} from '../../Ticket/Type/types';
import type {CollectionResponse} from '@/lib/Request/Type/types';

// A ticket attached to a release - the SAME shape every other ticket list in
// the app uses (TicketSummary, the GET .../ticket list resource), not a
// release-specific stripped-down subset - confirmed 2026-08-16 after the
// original 5-field version made Version Tracker's ticket list look/behave
// differently from every other ticket list (TicketsPage, SprintTicketPicker,
// ...). Reusing TicketSummary lets ReleaseCard render its tickets with the
// exact same TicketRow component those other lists use.
export type ReleaseTicket = TicketSummary;

// A planned version/release for a project - the "Version Tracker" module
// (src/App/Pages/Panel/Project/VersionTracker). `id` here is the backend's
// `versionId` (the GET resource's own field name) - flattened to `id` to
// match every other domain type's convention (Board/Sprint/Ticket all key
// off a plain `id`); the same value is what PUT .../release/{releaseId}
// takes in its path.
export type Release = {
  id: string;
  projectId: string;
  plannedReleaseDate: string;
  // Optional planned post-release "after care" window (how long the team
  // expects to actively watch/patch the release after it ships) - an
  // ISO-8601 duration from AFTER_CARE_PERIODS, or '' when none is planned.
  afterCarePeriod: string;
  status: string;
  versionNumber: string;
  // Free-text label, separate from versionNumber (e.g. "Autumn cleanup"
  // alongside "1.4.0") - added so the future Roadmap (built on top of
  // Version Tracker, not a separate per-ticket schedule - see memory)
  // has something more readable than a bare version number to show on
  // the timeline.
  name: string;
  tickets: ReleaseTicket[];
};

export type ReleaseResponseItem = {
  id: string;
  resource: {
    versionId: string;
    projectId: string;
    plannedReleaseDate: string;
    afterCarePeriod?: string;
    status: string;
    versionNumber: string;
    name: string;
    tickets: ReleaseTicket[];
  };
};

export type ListReleasesResponse = CollectionResponse<ReleaseResponseItem>;

export type ListReleasesResult =
  | {success: true; releases: Release[]; total: number}
  | {success: false};

// PUT .../release/{releaseId} body - no POST endpoint exists (confirmed
// 2026-08-16), so creating a new version reuses this same PUT with a
// client-generated UUID as releaseId (upsert - see useSaveReleaseHook).
export type SaveReleasePayload = {
  plannedReleaseDate: string;
  afterCarePeriod: string;
  status: string;
  versionNumber: string;
  name: string;
  ticketIds: string[];
};

export type SaveReleaseResult =
  | {success: true}
  | {success: false};
