import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {ListTicketsResponse, ListTicketsResult} from './Type/types';

const useGetTicketsHook = () => {
  const {request} = useRequestHook();

  // Omitting parentId lists this project's root tickets; passing one lists
  // that ticket's direct children - used to lazily expand a row in the tree.
  // The endpoint is paginated (API default page=0, limit=25) - page/limit
  // are only sent when given, so callers that don't pass them get exactly
  // the first 25, same as before these params existed.
  const getTickets = async (projectId: string, parentId?: string, page?: number, limit?: number): Promise<ListTicketsResult> => {
    try {
      const response = await request<undefined, ListTicketsResponse>({
        type: RequestMethod.GET,
        endpoint: `/api/project/${projectId}/ticket`,
        query: {
          ...(parentId ? {parentId} : {}),
          ...(page !== undefined ? {page: String(page)} : {}),
          ...(limit !== undefined ? {limit: String(limit)} : {}),
        },
      });

      return {
        success: true,
        total: response.data.meta.total,
        tickets: response.data.data.map((item) => ({
          id: item.resource.id,
          key: item.resource.key,
          title: item.resource.title,
          projectId: item.resource.projectId,
          assigneeIds: item.resource.assigneeIds,
          issueTypeId: item.resource.issueTypeId,
          statusId: item.resource.statusId,
          parentId: item.resource.parentId,
          priority: item.resource.priority,
          progress: item.resource.progress,
          timeSpentAll: item.resource.timeSpentAll,
          estimateAll: item.resource.estimateAll,
          estimate: item.resource.estimate,
          childCount: item.resource.childCount,
          tags: item.resource.tags,
          flagIds: item.resource.flagIds,
          createdAt: item.resource.createdAt,
        })),
      };
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {getTickets};
};

export default useGetTicketsHook;
