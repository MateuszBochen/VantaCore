import type {AdvancedSearchFilters} from './Type/types';

// Shared between AdvancedSearchPage (the standalone /search page) and
// SprintTicketPicker (search reused inside the New Sprint ticket picker,
// with types/projectIds locked - see AdvancedSearchFilters' lockedTypes/
// lockedProjectIds props) - kept out of either component file since
// react-refresh only allows component files to export components.
export const DEFAULT_ADVANCED_SEARCH_FILTERS: AdvancedSearchFilters = {
  q: '',
  types: ['project', 'subProject', 'ticket', 'testCase'],
  projectIds: [],
  statusIds: [],
  issueTypeIds: [],
  priorities: [],
  flagIds: [],
  tags: [],
  customFields: {},
  hasEstimation: null,
  createdFrom: null,
  createdTo: null,
  updatedFrom: null,
  updatedTo: null,
};
