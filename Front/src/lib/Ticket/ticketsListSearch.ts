import {buildAdvancedSearchQuery} from '../Search/advancedSearchQuery';
import type {AdvancedSearchFilters} from '../Search/Type/types';

// TicketsPage's search, as it appears in that page's own URL - the same
// encoding as /search (buildAdvancedSearchQuery), minus the two params the
// page locks anyway (types = tickets, projectIds = this project), so a
// shared/bookmarked link stays short and can't point at another project.
export const toTicketsListQuery = (filters: AdvancedSearchFilters): Record<string, string> => {
  const query = buildAdvancedSearchQuery(filters);
  delete query.types;
  delete query.projectIds;
  return query;
};

const storageKey = (projectId: string) => `tickets-list-search:${projectId}`;

// Last search run on a project's Tickets page (its query string, '' for
// none), so the ticket view's "← Tickets" returns to it instead of a blank
// list - a plain history back wouldn't do, since the user may have moved on
// to other tickets from there. sessionStorage: per browser tab, gone with
// it. Best effort - storage can be unavailable (private mode, blocked site
// data), in which case the link just falls back to the plain list.
export const rememberTicketsListSearch = (projectId: string, query: string): void => {
  try {
    if (query) {
      sessionStorage.setItem(storageKey(projectId), query);
    } else {
      sessionStorage.removeItem(storageKey(projectId));
    }
  } catch {
    // Storage unavailable - nothing to remember.
  }
};

export const getTicketsListPath = (projectId: string): string => {
  let query = '';

  try {
    query = sessionStorage.getItem(storageKey(projectId)) ?? '';
  } catch {
    // Storage unavailable - plain list.
  }

  return `/projects/${projectId}/tickets${query ? `?${query}` : ''}`;
};
