import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {ListAutomationExecutionsResponse, ListAutomationExecutionsResult} from './Type/types';

const useListAutomationRuleExecutionsHook = () => {
  const {request} = useRequestHook();

  const listAutomationRuleExecutions = async (
    projectId: string,
    ruleId: string,
    page: number,
    limit: number,
  ): Promise<ListAutomationExecutionsResult> => {
    try {
      const response = await request<undefined, ListAutomationExecutionsResponse>({
        type: RequestMethod.GET,
        endpoint: `/api/project/${projectId}/automation-rule/${ruleId}/executions`,
        query: {page: String(page), limit: String(limit)},
      });

      return {
        success: true,
        executions: response.data.data.map((item) => item.resource),
        total: response.data.meta.total,
      };
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {listAutomationRuleExecutions};
};

export default useListAutomationRuleExecutionsHook;
