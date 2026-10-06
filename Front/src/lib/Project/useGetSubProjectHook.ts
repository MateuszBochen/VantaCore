import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {GetSubProjectResponse, GetSubProjectResult} from './Type/types';

const useGetSubProjectHook = () => {
  const {request} = useRequestHook();

  const getSubProject = async (projectId: string, subProjectId: string): Promise<GetSubProjectResult> => {
    try {
      const response = await request<undefined, GetSubProjectResponse>({
        type: RequestMethod.GET,
        endpoint: `/api/project/${projectId}/sub-project/${subProjectId}`,
      });

      const {resource} = response.data;

      return {
        success: true,
        subProject: {
          id: resource.subProjectId,
          name: resource.name,
          status: resource.status,
          documentation: resource.documentation,
          versionId: resource.versionId,
          changedByUserId: resource.changedByUserId,
          changedByEmail: resource.changedByEmail,
          changedAt: resource.changedAt,
        },
      };
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {getSubProject};
};

export default useGetSubProjectHook;