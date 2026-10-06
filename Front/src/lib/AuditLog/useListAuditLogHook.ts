import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {AuditLogFilters, ListAuditLogResponse, ListAuditLogResult} from './Type/types';

const buildQuery = (filters: Partial<AuditLogFilters>, page: number, limit: number): Record<string, string> => {
  const query: Record<string, string> = {page: String(page), limit: String(limit)};

  if (filters.actorId) query.actorId = filters.actorId;
  if (filters.resourceType) query.resourceType = filters.resourceType;
  if (filters.action) query.action = filters.action;
  if (filters.from) query.from = filters.from;
  if (filters.till) query.till = filters.till;

  return query;
};

const useListAuditLogHook = () => {
  const {request} = useRequestHook();

  const listAuditLog = async (
    projectId: string,
    filters: Partial<AuditLogFilters>,
    page: number,
    limit: number,
  ): Promise<ListAuditLogResult> => {
    try {
      const response = await request<undefined, ListAuditLogResponse>({
        type: RequestMethod.GET,
        endpoint: `/api/project/${projectId}/audit-log`,
        query: buildQuery(filters, page, limit),
      });

      return {success: true, entries: response.data.data.map((item) => item.resource), total: response.data.meta.total};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {listAuditLog};
};

export default useListAuditLogHook;
