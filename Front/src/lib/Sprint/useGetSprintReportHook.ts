import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {GetSprintReportResponse, GetSprintReportResult} from './Type/types';

// GET /api/board/{boardId}/sprint/{sprintId}/report - ticketStatusTransitions
// confirmed 2026-08-11; burndownByUnit PROPOSED, folded into this same
// response rather than a separate endpoint (see SprintReport's own comment
// in Type/types.ts - both need the same underlying per-ticket history scan,
// so one endpoint covers both instead of two near-identical round trips).
// Any failure is still treated as "no data" rather than an error - callers
// hide the transition-count column and skip the burndown's actual line
// instead of erroring the whole summary page over non-critical metrics.
const useGetSprintReportHook = () => {
  const {request} = useRequestHook();

  const getSprintReport = async (boardId: string, sprintId: string): Promise<GetSprintReportResult> => {
    try {
      const response = await request<undefined, GetSprintReportResponse>({
        type: RequestMethod.GET,
        endpoint: `/api/board/${boardId}/sprint/${sprintId}/report`,
      });

      return {success: true, report: response.data.resource};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {getSprintReport};
};

export default useGetSprintReportHook;
