import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {eventBus} from '../EventBus/EventBus';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {TicketSaveFailedEvent} from './Event/TicketSaveFailedEvent';
import {TicketWasSavedEvent} from './Event/TicketWasSavedEvent';
import type {TestCaseMutationResult} from './Type/types';

// DELETE /api/project/{projectId}/ticket/{ticketId}/testcase/{testCaseId} -
// only meaningful for a test case that's actually been persisted (via a
// prior Submit) - one that only exists locally so far is just removed from
// state, no request needed (see TicketTestCasesSection's handleRemove).
const useDeleteTestCaseHook = () => {
  const {request} = useRequestHook();

  const deleteTestCase = async (projectId: string, ticketId: string, testCaseId: string): Promise<TestCaseMutationResult> => {
    try {
      await request<undefined, void>({
        type: RequestMethod.DELETE,
        endpoint: `/api/project/${projectId}/ticket/${ticketId}/testcase/${testCaseId}`,
      });

      eventBus.dispatch(new TicketWasSavedEvent('Test case deleted.'));

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        eventBus.dispatch(new TicketSaveFailedEvent(getApiErrorMessage(error, "Couldn't delete the test case — please try again.")));
        return {success: false};
      }

      throw error;
    }
  };

  return {deleteTestCase};
};

export default useDeleteTestCaseHook;
