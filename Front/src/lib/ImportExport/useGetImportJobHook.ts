import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {ImportJob} from './Type/types';

type GetImportJobResponse = {
  id: string;
  type: string;
  resource: ImportJob;
};

type GetImportJobResult = {success: true; job: ImportJob} | {success: false};

const useGetImportJobHook = () => {
  const {request} = useRequestHook();

  const getImportJob = async (projectId: string, importJobId: string): Promise<GetImportJobResult> => {
    try {
      const response = await request<undefined, GetImportJobResponse>({
        type: RequestMethod.GET,
        endpoint: `/api/project/${projectId}/import/${importJobId}`,
      });

      return {success: true, job: response.data.resource};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }
      throw error;
    }
  };

  return {getImportJob};
};

export default useGetImportJobHook;
