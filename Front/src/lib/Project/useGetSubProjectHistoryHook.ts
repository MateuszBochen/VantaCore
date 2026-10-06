import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {GetSubProjectResponse, GetSubProjectResult} from './Type/types';

const useGetSubProjectHistoryHook = () => {
  const {request} = useRequestHook();

  // Same envelope as useGetSubProjectHook. `before` is exclusive - the backend
  // returns the single most recent version strictly older than it. Pass "now"
  // to get the latest saved version, or a version's own `changedAt` to step
  // back one further (see useGetPlatformDocumentationHistoryHook, same convention).
  const getSubProjectHistory = async (
    projectId: string,
    subProjectId: string,
    before: Date,
  ): Promise<GetSubProjectResult> => {
    try {
      const response = await request<undefined, GetSubProjectResponse>({
        type: RequestMethod.GET,
        endpoint: `/api/project/${projectId}/sub-project/${subProjectId}/history`,
        query: {before: before.toISOString()},
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

  return {getSubProjectHistory};
};

export default useGetSubProjectHistoryHook;