import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {GetTicketHistoryResponse, GetTicketHistoryResult} from './Type/types';

// GET .../ticket/{ticketId}/history?before=<ISOString> - same mechanism as
// sub-project/platform-doc history (see useGetSubProjectHistoryHook):
// `before` is exclusive, the backend returns the single most recent version
// strictly older than it. Pass "now" to get the latest saved version, or a
// version's own `changedAt` to step back one further.
const useGetTicketHistoryHook = () => {
  const {request} = useRequestHook();

  const getTicketHistory = async (projectId: string, ticketId: string, before: Date): Promise<GetTicketHistoryResult> => {
    try {
      const response = await request<undefined, GetTicketHistoryResponse>({
        type: RequestMethod.GET,
        endpoint: `/api/project/${projectId}/ticket/${ticketId}/history`,
        query: {before: before.toISOString()},
      });

      const {resource} = response.data;

      return {
        success: true,
        version: {
          versionId: resource.id,
          ticketId: resource.ticketId,
          subProjectId: resource.subProjectId,
          issueTypeId: resource.issueTypeId,
          statusId: resource.statusId,
          parentId: resource.parentId,
          title: resource.title,
          description: resource.description,
          priority: resource.priority,
          estimate: resource.estimate,
          assigneeIds: resource.assigneeIds,
          flagIds: resource.flagIds,
          tags: resource.tags,
          customFields: resource.customFields,
          relatedTickets: resource.relatedTickets,
          changedByUserId: resource.changedByUserId,
          changedByEmail: resource.changedByEmail,
          changedAt: resource.changedAt,
        },
      };
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {getTicketHistory};
};

export default useGetTicketHistoryHook;
