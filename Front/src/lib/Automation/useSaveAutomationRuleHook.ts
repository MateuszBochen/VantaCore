import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import type {AutomationEngineRule, SaveAutomationEngineRuleResult} from './Type/types';

// Upsert - id is always client-generated (see createDraftAutomationRule),
// same PUT-is-create-and-update convention as every other resource in this app.
const useSaveAutomationRuleHook = () => {
  const {request} = useRequestHook();

  const saveAutomationRule = async (projectId: string, rule: AutomationEngineRule): Promise<SaveAutomationEngineRuleResult> => {
    try {
      await request<AutomationEngineRule, void>({
        type: RequestMethod.PUT,
        endpoint: `/api/project/${projectId}/automation-rule/${rule.id}`,
        data: rule,
      });

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false, message: getApiErrorMessage(error, "Couldn't save the rule — please try again.")};
      }

      throw error;
    }
  };

  return {saveAutomationRule};
};

export default useSaveAutomationRuleHook;
