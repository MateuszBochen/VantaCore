import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {ListCommentsResponse, ListCommentsResult} from './Type/types';

const useListCommentsHook = () => {
  const {request} = useRequestHook();

  const listComments = async (projectId: string, ticketId: string): Promise<ListCommentsResult> => {
    try {
      const response = await request<undefined, ListCommentsResponse>({
        type: RequestMethod.GET,
        endpoint: `/api/project/${projectId}/ticket/${ticketId}/comment`,
      });

      const comments = response.data.data.map((item) => {
        const authorId = item.resource.authorId ?? item.resource.author?.id ?? item.resource.actor?.id ?? '';

        if (!authorId) {
          // Neither shape this hook knows about matched - dumps the raw
          // resource so the real field name is obvious in devtools rather
          // than silently showing "Unknown user" with no way to tell why.
          console.warn('[useListCommentsHook] Could not resolve an author id from comment resource', item.resource);
        }

        return {
          id: item.resource.id,
          authorId,
          body: item.resource.body,
          createdAt: item.resource.createdAt,
          changedAt: item.resource.changedAt,
        };
      });

      // Newest first - the API's own ordering isn't guaranteed, and this is
      // the one place both the initial load and every refetch (add/edit/
      // delete) go through, so callers never have to re-sort themselves.
      comments.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      return {success: true, comments};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {listComments};
};

export default useListCommentsHook;
