import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {buildAdvancedSearchQuery as buildQuery} from './advancedSearchQuery';
import {unwrapSearchResource, unwrapSearchSection} from './unwrapSearchSection';
import type {AdvancedSearchFilters, AdvancedSearchResponse, FullModeSearchResponse, FullModeSearchResult, GlobalSearchResult} from './Type/types';

// Same GET /api/search as the topbar's basic search (useGlobalSearchHook) -
// NOT a separate /api/search/advanced path. Originally built as a distinct
// endpoint so an unimplemented path would 404/500 honestly rather than
// Spring silently ignoring unknown params on the existing one, but the
// backend team's actual plan is to extend /api/search itself with these
// filter params, not stand up a second endpoint - reverted to match.
//
// No `scope` param here (unlike the basic search) - advanced search sends
// `projectIds` (plural, possibly several/none) instead, which backend infers
// scope from directly; the basic search's own binary 'project'|'global' enum
// doesn't need to apply here.
//
// Query-building itself lives in advancedSearchQuery.ts, shared with
// AdvancedSearchPage's own URL sync - see that file for the param encoding.

const useAdvancedSearchHook = () => {
  const {request} = useRequestHook();

  const search = async (filters: AdvancedSearchFilters): Promise<GlobalSearchResult> => {
    try {
      const response = await request<undefined, AdvancedSearchResponse>({
        type: RequestMethod.GET,
        endpoint: '/api/search',
        query: buildQuery(filters),
      });

      return {success: true, ...unwrapSearchResource(response.data.resource)};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  // Ticket-only, paginated, full GetTicketResult-shaped hits (childCount
  // included, so a result can show an expand-to-children control the same
  // way TicketTree already does) - callers lock filters.types to ['ticket'],
  // so only the tickets section (and its total, for "Load more (x of y)")
  // matters here.
  const searchTicketsFull = async (filters: AdvancedSearchFilters, page: number, limit: number): Promise<FullModeSearchResult> => {
    try {
      const response = await request<undefined, FullModeSearchResponse>({
        type: RequestMethod.GET,
        endpoint: '/api/search',
        query: {...buildQuery(filters), fullMode: 'true', page: String(page), limit: String(limit)},
      });

      const {tickets} = response.data.resource;

      return {success: true, tickets: unwrapSearchSection(tickets), total: tickets.total};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {search, searchTicketsFull};
};

export default useAdvancedSearchHook;
