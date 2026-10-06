import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import type {DeleteAutomationEngineRuleResult} from './Type/types';

const useDeleteAutomationRuleHook = () => {
  const {request} = useRequestHook();

  const deleteAutomationRule = async (projectId: string, ruleId: string): Promise<DeleteAutomationEngineRuleResult> => {
    try {
      await request<undefined, void>({
        type: RequestMethod.DELETE,
        endpoint: `/api/project/${projectId}/automation-rule/${ruleId}`,
      });

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false, message: getApiErrorMessage(error, "Couldn't delete the rule — please try again.")};
      }

      throw error;
    }
  };

  return {deleteAutomationRule};
};

export default useDeleteAutomationRuleHook;
