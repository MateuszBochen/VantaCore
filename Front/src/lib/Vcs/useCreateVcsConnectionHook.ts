import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {toastService} from '../Toast/ToastService';
import type {CreateVcsConnectionResponse, CreateVcsConnectionResult, VcsProvider} from './Type/types';

type CreateVcsConnectionPayload = {
  provider: VcsProvider;
  repoUrl: string;
};

const useCreateVcsConnectionHook = () => {
  const {request} = useRequestHook();

  const createVcsConnection = async (projectId: string, payload: CreateVcsConnectionPayload): Promise<CreateVcsConnectionResult> => {
    try {
      const response = await request<CreateVcsConnectionPayload, CreateVcsConnectionResponse>({
        type: RequestMethod.POST,
        endpoint: `/api/project/${projectId}/vcs-connection`,
        data: payload,
      });

      return {success: true, connection: response.data.resource};
    } catch (error) {
      if (isAxiosError(error)) {
        toastService.push('error', getApiErrorMessage(error, "Couldn't connect this repository — please try again."));
        return {success: false};
      }
      throw error;
    }
  };

  return {createVcsConnection};
};

export default useCreateVcsConnectionHook;
