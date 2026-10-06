import {DEFAULT_ADVANCED_SEARCH_FILTERS} from './defaultAdvancedSearchFilters';
import type {AdvancedSearchFilters, SearchResultType} from './Type/types';

// Repeated-value params (types/projectIds/statusIds/issueTypeIds/priorities/flagIds/tags)
// are comma-joined into a single query value, not sent as repeated keys -
// apiRequest.ts pipes `query` through `qs.stringify(..., {encode:false})`
// with qs's default arrayFormat ('indices', e.g. `types[0]=a&types[1]=b`),
// which Spring's @RequestParam List<String> binding does NOT understand.
// Spring's default collection binder DOES split a single comma-separated
// value, so that's the format actually compatible with both ends today.
const joinOrUndefined = (values: readonly (string | number)[]): string | undefined =>
  values.length > 0 ? values.join(',') : undefined;

// Shared by useAdvancedSearchHook (the actual /api/search request) AND
// AdvancedSearchPage (the URL's own ?query string) - both need the exact
// same flat Record<string,string> shape, so the URL a search leaves you on
// is trivially the same query the backend was asked, not a second encoding
// that could drift from it.
export const buildAdvancedSearchQuery = (filters: AdvancedSearchFilters): Record<string, string> => {
  const query: Record<string, string> = {};

  if (filters.q.trim()) {
    query.q = filters.q.trim();
  }

  const types = joinOrUndefined(filters.types);
  if (types) query.types = types;

  const projectIds = joinOrUndefined(filters.projectIds);
  if (projectIds) query.projectIds = projectIds;

  const statusIds = joinOrUndefined(filters.statusIds);
  if (statusIds) query.statusIds = statusIds;

  const issueTypeIds = joinOrUndefined(filters.issueTypeIds);
  if (issueTypeIds) query.issueTypeIds = issueTypeIds;

  const priorities = joinOrUndefined(filters.priorities);
  if (priorities) query.priorities = priorities;

  const flagIds = joinOrUndefined(filters.flagIds);
  if (flagIds) query.flagIds = flagIds;

  const tags = joinOrUndefined(filters.tags);
  if (tags) query.tags = tags;

  Object.entries(filters.customFields).forEach(([fieldId, value]) => {
    if (value.trim()) {
      query[`customField.${fieldId}`] = value;
    }
  });

  if (filters.hasEstimation !== null) query.hasEstimation = String(filters.hasEstimation);

  if (filters.createdFrom) query.createdFrom = filters.createdFrom;
  if (filters.createdTo) query.createdTo = filters.createdTo;
  if (filters.updatedFrom) query.updatedFrom = filters.updatedFrom;
  if (filters.updatedTo) query.updatedTo = filters.updatedTo;

  return query;
};

const splitOrEmpty = (value: string | null): string[] => (value ? value.split(',').filter(Boolean) : []);

// Inverse of buildAdvancedSearchQuery - restores a full filter set from the
// page's own URL (see AdvancedSearchPage, which writes these same params
// back into the URL on every search via setSearchParams). A param missing
// from the URL falls back to DEFAULT_ADVANCED_SEARCH_FILTERS' value for it
// rather than an empty list, so e.g. `types` still defaults to "every
// type" the same way a brand new /search visit does, not "no types" just
// because the URL never happened to mention it.
export const parseAdvancedSearchFiltersFromQuery = (searchParams: URLSearchParams): AdvancedSearchFilters => {
  const customFields: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (key.startsWith('customField.')) {
      customFields[key.slice('customField.'.length)] = value;
    }
  });

  const types = searchParams.get('types');
  const projectIds = searchParams.get('projectIds');
  const statusIds = searchParams.get('statusIds');
  const issueTypeIds = searchParams.get('issueTypeIds');
  const priorities = searchParams.get('priorities');
  const flagIds = searchParams.get('flagIds');
  const tags = searchParams.get('tags');
  const hasEstimation = searchParams.get('hasEstimation');

  return {
    q: searchParams.get('q') ?? DEFAULT_ADVANCED_SEARCH_FILTERS.q,
    types: types ? (splitOrEmpty(types) as SearchResultType[]) : DEFAULT_ADVANCED_SEARCH_FILTERS.types,
    projectIds: projectIds ? splitOrEmpty(projectIds) : DEFAULT_ADVANCED_SEARCH_FILTERS.projectIds,
    statusIds: statusIds ? splitOrEmpty(statusIds) : DEFAULT_ADVANCED_SEARCH_FILTERS.statusIds,
    issueTypeIds: issueTypeIds ? splitOrEmpty(issueTypeIds) : DEFAULT_ADVANCED_SEARCH_FILTERS.issueTypeIds,
    priorities: priorities ? splitOrEmpty(priorities).map(Number) : DEFAULT_ADVANCED_SEARCH_FILTERS.priorities,
    flagIds: flagIds ? splitOrEmpty(flagIds) : DEFAULT_ADVANCED_SEARCH_FILTERS.flagIds,
    tags: tags ? splitOrEmpty(tags) : DEFAULT_ADVANCED_SEARCH_FILTERS.tags,
    customFields,
    hasEstimation: hasEstimation === 'true' ? true : hasEstimation === 'false' ? false : DEFAULT_ADVANCED_SEARCH_FILTERS.hasEstimation,
    createdFrom: searchParams.get('createdFrom') ?? DEFAULT_ADVANCED_SEARCH_FILTERS.createdFrom,
    createdTo: searchParams.get('createdTo') ?? DEFAULT_ADVANCED_SEARCH_FILTERS.createdTo,
    updatedFrom: searchParams.get('updatedFrom') ?? DEFAULT_ADVANCED_SEARCH_FILTERS.updatedFrom,
    updatedTo: searchParams.get('updatedTo') ?? DEFAULT_ADVANCED_SEARCH_FILTERS.updatedTo,
  };
};
