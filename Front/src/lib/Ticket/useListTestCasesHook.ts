import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {ListTestCasesResponse, ListTestCasesResult, TestCaseStatus} from './Type/types';

// GET .../ticket/{ticketId}/testcase - the path given also had a trailing
// {testCaseId} segment, which doesn't match the list-shaped
// {meta, data: [...]} response body given alongside it; treated as a
// copy/paste artifact from the DELETE endpoint line above it, so this omits
// it, matching every other list endpoint's convention (worklog, comments,
// tickets).
const useListTestCasesHook = () => {
  const {request} = useRequestHook();

  const listTestCases = async (projectId: string, ticketId: string): Promise<ListTestCasesResult> => {
    try {
      const response = await request<undefined, ListTestCasesResponse>({
        type: RequestMethod.GET,
        endpoint: `/api/project/${projectId}/ticket/${ticketId}/testcase`,
      });

      return {
        success: true,
        testCases: response.data.data.map((item) => ({
          id: item.resource.id,
          title: item.resource.title,
          steps: item.resource.steps,
          expectedResult: item.resource.expectedResult,
          status: item.resource.status as TestCaseStatus,
          createdAt: item.resource.createdAt,
          authorId: item.resource.author.id,
        })),
      };
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {listTestCases};
};

export default useListTestCasesHook;
