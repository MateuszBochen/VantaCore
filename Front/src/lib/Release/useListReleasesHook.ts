import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {ListReleasesResponse, ListReleasesResult} from './Type/types';

// GET /api/project/{projectId}/release - confirmed spec 2026-08-16.
// Paginated (meta.page/limit/total, backend defaults limit to 25) - page/
// limit are explicit params here (not left to the backend default) so
// VersionTrackerPage's "Load more" can request subsequent pages the same
// way SprintTicketPicker does for search results.
const useListReleasesHook = () => {
  const {request} = useRequestHook();

  const listReleases = async (projectId: string, page: number, limit: number): Promise<ListReleasesResult> => {
    try {
      const response = await request<undefined, ListReleasesResponse>({
        type: RequestMethod.GET,
        endpoint: `/api/project/${projectId}/release`,
        query: {page: String(page), limit: String(limit)},
      });

      return {
        success: true,
        releases: response.data.data.map((item) => ({
          id: item.resource.versionId,
          projectId: item.resource.projectId,
          plannedReleaseDate: item.resource.plannedReleaseDate,
          afterCarePeriod: item.resource.afterCarePeriod ?? '',
          status: item.resource.status,
          versionNumber: item.resource.versionNumber,
          name: item.resource.name,
          tickets: item.resource.tickets,
        })),
        total: response.data.meta.total,
      };
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {listReleases};
};

export default useListReleasesHook;
