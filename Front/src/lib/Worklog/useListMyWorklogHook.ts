import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {ListMyWorklogResponse, ListMyWorklogResult} from './Type/types';

// GET /api/worklog/mine?startDate&endDate&userIds - confirmed live
// 2026-08-16 (userIds filter added later the same day). Every other worklog
// endpoint is scoped to a single ticket (GET .../ticket/{id}/worklog);
// MyWorklogPage's calendar needs one or several users' entries across every
// project/ticket for a date range instead, which no ticket-scoped endpoint
// could answer without fetching every ticket in every project. Omitting
// userIds defaults to the requesting user's own entries (same as before the
// filter existed) - MyWorklogPage still always sends it explicitly (see its
// own comment) so the calendar's own "which users" selection is unambiguous.
const useListMyWorklogHook = () => {
  const {request} = useRequestHook();

  // startDate/endDate: ISO yyyy-MM-dd, both inclusive. userIds: comma-joined
  // (not repeated query keys - see useAdvancedSearchHook's own comment on
  // why: qs's default array format doesn't match Spring's List<String>
  // binding, a single comma-separated value does).
  const listMyWorklog = async (startDate: string, endDate: string, userIds?: string[]): Promise<ListMyWorklogResult> => {
    try {
      const query: Record<string, string> = {startDate, endDate};

      if (userIds && userIds.length > 0) {
        query.userIds = userIds.join(',');
      }

      const response = await request<undefined, ListMyWorklogResponse>({
        type: RequestMethod.GET,
        endpoint: '/api/worklog/mine',
        query,
      });

      return {
        success: true,
        entries: response.data.data.map((item) => ({
          id: item.resource.id,
          minutes: item.resource.minutes,
          dateTime: item.resource.date,
          note: item.resource.note,
          actorId: item.resource.actor.id,
          ticket: item.resource.ticket,
          project: item.resource.project,
        })),
      };
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {listMyWorklog};
};

export default useListMyWorklogHook;
