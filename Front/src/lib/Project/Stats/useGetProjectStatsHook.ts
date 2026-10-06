import {isAxiosError} from 'axios';
import useRequestHook from '../../Request/useRequestHook';
import {RequestMethod} from '../../Request/Type/types';
import type {GetProjectStatsResponse, GetProjectStatsResult} from './Type/types';

const useGetProjectStatsHook = () => {
  const {request} = useRequestHook();

  const getProjectStats = async (projectId: string): Promise<GetProjectStatsResult> => {
    try {
      const response = await request<undefined, GetProjectStatsResponse>({
        type: RequestMethod.GET,
        endpoint: `/api/project/${projectId}/stats`,
      });

      return {success: true, stats: response.data.resource};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }
      throw error;
    }
  };

  return {getProjectStats};
};

export default useGetProjectStatsHook;
