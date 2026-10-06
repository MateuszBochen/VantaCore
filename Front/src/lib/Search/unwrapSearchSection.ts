import type {GlobalSearchResponseData, SearchResponseResource, SearchResultTicket, SearchSection} from './Type/types';

// /api/search wraps every section in its own page envelope - callers that
// only want the hits (topbar search, advanced search's non-ticket sections,
// pickers) get plain arrays through these, so the envelope stays a detail
// of the two search hooks.
export const unwrapSearchSection = <T,>(section: SearchSection<T>): T[] => section.data.map((item) => item.resource);

export const unwrapSearchResource = (resource: SearchResponseResource<SearchResultTicket>): GlobalSearchResponseData => ({
  projects: unwrapSearchSection(resource.projects),
  subProjects: unwrapSearchSection(resource.subProjects),
  tickets: unwrapSearchSection(resource.tickets),
  testCases: unwrapSearchSection(resource.testCases),
});
