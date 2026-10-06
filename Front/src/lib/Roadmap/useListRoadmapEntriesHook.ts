import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {ListRoadmapEntriesResponse, ListRoadmapEntriesResult} from './Type/types';

const DEFAULT_LIMIT = 1000;

// GET /api/roadmap-entry - cross-project aggregate of every project's
// Release resources (see Type/types.ts's own comment for why this replaced
// a per-ticket, manually-scheduled design). `from`/`till` are optional
// yyyy-MM-dd bounds on plannedReleaseDate - RoadmapTimeline passes its own
// visible window so this never has to fetch every release the whole app has
// ever planned just to show 16 weeks of it.
const useListRoadmapEntriesHook = () => {
  const {request} = useRequestHook();

  const listRoadmapEntries = async (from?: string, till?: string): Promise<ListRoadmapEntriesResult> => {
    try {
      const response = await request<undefined, ListRoadmapEntriesResponse>({
        type: RequestMethod.GET,
        endpoint: '/api/roadmap-entry',
        query: {
          page: '0',
          limit: String(DEFAULT_LIMIT),
          ...(from ? {from} : {}),
          ...(till ? {till} : {}),
        },
      });

      return {
        success: true,
        releases: response.data.data.map((item) => ({
          id: item.resource.versionId,
          projectId: item.resource.projectId,
          plannedReleaseDate: item.resource.plannedReleaseDate,
          afterCarePeriod: item.resource.afterCarePeriod ?? '',
          // Backend sends this lowercased ("plan"/"released" - see
          // ListRoadmapEntriesQueryHandler's own release.status().name()
          // .toLowerCase()), but every frontend consumer (STATUS_COLORS
          // here, RELEASE_STATUSES in releaseStatuses.ts) keys off the
          // uppercase enum name - uppercased here so the status actually
          // matches instead of silently falling through to the "unknown
          // status" gray fallback.
          status: item.resource.status.toUpperCase(),
          versionNumber: item.resource.versionNumber,
          name: item.resource.name,
          tickets: item.resource.tickets,
        })),
      };
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {listRoadmapEntries};
};

export default useListRoadmapEntriesHook;
