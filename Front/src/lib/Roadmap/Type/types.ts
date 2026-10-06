import type {CollectionResponse} from '@/lib/Request/Type/types';

// The Roadmap is built directly on top of Version Tracker's Release
// resource (see memory: an earlier per-ticket "RoadmapEntry you drag/resize
// yourself" design was scrapped - manually placing every ticket individually
// made no sense once Release already aggregates a version's tickets). This
// is what GET /api/roadmap-entry answers with per item - the SAME shape as
// ReleaseResponseItem's own `resource` (see lib/Release/Type/types.ts),
// except `tickets` is a lighter, roadmap-specific shape (id/statusId/title/
// key only - no full TicketSummary) since this endpoint aggregates across
// every project at once.
export type RoadmapReleaseTicket = {
  id: string;
  statusId: string;
  title: string;
  key: string;
};

export type RoadmapReleaseResponseItem = {
  id: string;
  resource: {
    versionId: string;
    projectId: string;
    plannedReleaseDate: string;
    afterCarePeriod?: string;
    status: string;
    versionNumber: string;
    name: string;
    tickets: RoadmapReleaseTicket[];
  };
};

export type ListRoadmapEntriesResponse = CollectionResponse<RoadmapReleaseResponseItem>;

// `id` here is the release's own versionId (flattened, same convention as
// Release.id elsewhere) - this app-level shape is what RoadmapPage/
// RoadmapTimeline actually work with, response parsing happens once in the
// hook.
export type RoadmapRelease = {
  id: string;
  projectId: string;
  plannedReleaseDate: string;
  // See Release.afterCarePeriod - carried through here so the roadmap's
  // inline edit panel doesn't wipe it on save (the PUT is a full upsert).
  afterCarePeriod: string;
  status: string;
  versionNumber: string;
  name: string;
  tickets: RoadmapReleaseTicket[];
};

export type ListRoadmapEntriesResult = {success: true; releases: RoadmapRelease[]} | {success: false};
