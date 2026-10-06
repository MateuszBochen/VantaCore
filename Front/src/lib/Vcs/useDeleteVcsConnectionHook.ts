import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {toastService} from '../Toast/ToastService';
import type {VcsConnectionMutationResult} from './Type/types';

const useDeleteVcsConnectionHook = () => {
  const {request} = useRequestHook();

  const deleteVcsConnection = async (projectId: string, connectionId: string): Promise<VcsConnectionMutationResult> => {
    try {
      await request<undefined, void>({
        type: RequestMethod.DELETE,
        endpoint: `/api/project/${projectId}/vcs-connection/${connectionId}`,
      });

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        toastService.push('error', "Couldn't remove this connection — please try again.");
        return {success: false};
      }
      throw error;
    }
  };

  return {deleteVcsConnection};
};

export default useDeleteVcsConnectionHook;
