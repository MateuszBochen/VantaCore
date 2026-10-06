import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {ListAutomationEngineRulesResponse, ListAutomationEngineRulesResult} from './Type/types';

const useListAutomationRulesHook = () => {
  const {request} = useRequestHook();

  const listAutomationRules = async (projectId: string): Promise<ListAutomationEngineRulesResult> => {
    try {
      const response = await request<undefined, ListAutomationEngineRulesResponse>({
        type: RequestMethod.GET,
        endpoint: `/api/project/${projectId}/automation-rule`,
      });

      return {success: true, rules: response.data.data.map((item) => item.resource)};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {listAutomationRules};
};

export default useListAutomationRulesHook;
