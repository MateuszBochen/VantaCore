import type {Ticket} from '@/lib/Ticket/Type/types';

export type SearchScope = 'project' | 'global';

export type SearchResultProject = {
  id: string;
  name: string;
};

export type SearchResultSubProject = {
  id: string;
  name: string;
  projectId: string;
};

export type SearchResultTicket = {
  id: string;
  key: string;
  title: string;
  projectId: string;
};

// Test cases have no page of their own - they live inside their parent
// ticket's "Test Cases" tab, so a result needs the parent ticket's id/key to
// build a deep link (see GlobalSearch.tsx's navigation targets).
export type SearchResultTestCase = {
  id: string;
  title: string;
  ticketId: string;
  ticketKey: string;
  projectId: string;
};

// What the search hooks hand to callers - plain arrays, the per-section
// envelopes below already unwrapped (see unwrapSearchSection).
export type GlobalSearchResponseData = {
  projects: SearchResultProject[];
  subProjects: SearchResultSubProject[];
  tickets: SearchResultTicket[];
  testCases: SearchResultTestCase[];
};

// Every section of /api/search is its own page (2026-09-27): the same
// page/limit query params apply to all four, each reports its own total -
// same {page, limit, total, data: [{id, resource}]} collection shape as the
// list endpoints, just nested per section instead of at the top level.
export type SearchSection<T> = {
  page: number;
  limit: number;
  total: number;
  data: {id: string; resource: T}[];
};

// The wire shape of GET /api/search's resource (both hooks).
export type SearchResponseResource<TTicket> = {
  projects: SearchSection<SearchResultProject>;
  subProjects: SearchSection<SearchResultSubProject>;
  tickets: SearchSection<TTicket>;
  testCases: SearchSection<SearchResultTestCase>;
};

// Singular-resource envelope ({id, type, resource}) - matches
// GetProjectResponse's convention; the paging lives one level down, per
// section (SearchSection).
export type GlobalSearchResponse = {
  id: string;
  type: string;
  resource: SearchResponseResource<SearchResultTicket>;
};

export type GlobalSearchResult =
  | ({success: true} & GlobalSearchResponseData)
  | {success: false};

export type SearchResultType = 'project' | 'subProject' | 'ticket' | 'testCase';

// Custom fields are per-project (Project.customFieldDefinitions), so this is
// only meaningful (and only shown - see AdvancedSearchFilters) once exactly
// one project is selected; keyed by CustomFieldDefinition.id, equals-match.
export type AdvancedSearchFilters = {
  q: string;
  types: SearchResultType[];
  projectIds: string[];
  statusIds: string[];
  // Ticket-only, per-project like statusIds (Project.issueTypes).
  issueTypeIds: string[];
  priorities: number[];
  flagIds: string[];
  tags: string[];
  customFields: Record<string, string>;
  // Ticket-only: true = has an estimate, false = has none, null = no filter
  // (param omitted from the request entirely, not sent as "null").
  hasEstimation: boolean | null;
  createdFrom: string | null;
  createdTo: string | null;
  updatedFrom: string | null;
  updatedTo: string | null;
};

// Same singular-resource envelope as GlobalSearchResponse - a separate type
// alias (not a reuse of GlobalSearchResponse) since these are genuinely
// different endpoints/contracts that happen to share a shape today; keeping
// them distinct means one can evolve without silently affecting the other.
export type AdvancedSearchResponse = {
  id: string;
  type: string;
  resource: SearchResponseResource<SearchResultTicket>;
};

// total = every matching ticket across all pages, null while the API doesn't
// send ticketsTotal yet (see FullModeSearchResponse).
// total = every matching ticket across all pages (tickets section's total).
export type FullModeSearchResult =
  | {success: true; tickets: Ticket[]; total: number}
  | {success: false};

// fullMode=true (confirmed 2026-08-13): the ticket section returns the exact
// same object GET /api/project/{projectId}/ticket/{ticketId} does, not the
// lightweight SearchResultTicket hit - projects/subProjects/testCases are
// irrelevant here since SprintTicketPicker (the only caller) always locks
// types to ['ticket'].
export type FullModeSearchResponse = {
  id: string;
  type: string;
  resource: SearchResponseResource<Ticket>;
};
