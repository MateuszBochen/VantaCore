import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {toastService} from '../Toast/ToastService';
import type {ExportTicketFilters} from './Type/types';

// Same comma-joined repeated-value query convention as useAdvancedSearchHook
// (Spring's default List<String> binder splits a single comma-separated
// value; qs's array-of-keys format doesn't).
const buildQuery = (filters: ExportTicketFilters): Record<string, string> => {
  const query: Record<string, string> = {};

  if (filters.issueTypeIds.length > 0) {
    query.types = filters.issueTypeIds.join(',');
  }

  if (filters.statusIds.length > 0) {
    query.statusIds = filters.statusIds.join(',');
  }

  return query;
};

// Two separate endpoints, not one with an "include attachments" flag - see
// the sub-project's ADR: the plain CSV export stays a single simple output
// format for its existing reporting/spreadsheet consumers, the ZIP is an
// intentionally separate code path.
const useExportTicketsHook = () => {
  const {request} = useRequestHook();

  const exportTickets = async (projectId: string, filters: ExportTicketFilters, full: boolean): Promise<boolean> => {
    try {
      const response = await request<undefined, Blob>({
        type: RequestMethod.GET,
        endpoint: `/api/project/${projectId}/ticket/export${full ? '/full' : ''}`,
        query: buildQuery(filters),
        responseType: 'blob',
      });

      const objectUrl = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `tickets-export.${full ? 'zip' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);

      return true;
    } catch (error) {
      if (isAxiosError(error)) {
        toastService.push('error', "Couldn't export tickets — please try again.");
        return false;
      }
      throw error;
    }
  };

  return {exportTickets};
};

export default useExportTicketsHook;
