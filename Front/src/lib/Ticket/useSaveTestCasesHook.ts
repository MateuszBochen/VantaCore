import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {eventBus} from '../EventBus/EventBus';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {TicketSaveFailedEvent} from './Event/TicketSaveFailedEvent';
import {TicketWasSavedEvent} from './Event/TicketWasSavedEvent';
import type {TestCase, TestCaseMutationResult} from './Type/types';

type SaveTestCasesPayload = {
  testCases: Pick<TestCase, 'id' | 'title' | 'steps' | 'expectedResult' | 'status'>[];
};

// PUT /api/project/{projectId}/ticket/{ticketId}/testcase - bulk create+
// update in one request (unlike worklog/comments, this isn't per-entry) -
// deletion has its own endpoint instead (useDeleteTestCaseHook). Submit on
// the Test Cases step sends the whole current array through this - see
// TicketTestCasesSection's imperative `submit` handle.
const useSaveTestCasesHook = () => {
  const {request} = useRequestHook();

  const saveTestCases = async (projectId: string, ticketId: string, testCases: TestCase[]): Promise<TestCaseMutationResult> => {
    try {
      const payload: SaveTestCasesPayload = {
        testCases: testCases.map(({id, title, steps, expectedResult, status}) => ({id, title, steps, expectedResult, status})),
      };

      await request<SaveTestCasesPayload, void>({
        type: RequestMethod.PUT,
        endpoint: `/api/project/${projectId}/ticket/${ticketId}/testcase`,
        data: payload,
      });

      eventBus.dispatch(new TicketWasSavedEvent('Test cases saved.'));

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        eventBus.dispatch(new TicketSaveFailedEvent(getApiErrorMessage(error, "Couldn't save test cases — please try again.")));
        return {success: false};
      }

      throw error;
    }
  };

  return {saveTestCases};
};

export default useSaveTestCasesHook;
