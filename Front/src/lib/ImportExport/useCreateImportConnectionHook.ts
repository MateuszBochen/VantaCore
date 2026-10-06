import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {toastService} from '../Toast/ToastService';
import type {ImportConnectionProvider} from './Type/types';

type CreateImportConnectionPayload = {
  provider: ImportConnectionProvider;
  baseUrl: string;
  // The raw token/PAT the user pasted in - stored server-side and never
  // round-tripped back to the frontend afterwards (see the sub-project's
  // Solution Design: the connection is referenced by connectionId from then
  // on, not by re-sending the credential).
  token: string;
  // Jira Cloud's API token auth is Basic (email + token), not a bearer
  // token alone - unlike Azure DevOps' PAT, which needs no accompanying
  // identity field. Left undefined for AZURE_DEVOPS.
  email?: string;
  // Which single project within that Jira site / Azure DevOps organization
  // to pull from - baseUrl alone only identifies the site/org, which can
  // (and typically does) host several projects. Jira's is a short key
  // (e.g. "PROJ", visible in every one of its issue keys); Azure DevOps'
  // is the project's display name from its own URL. Required for both.
  sourceProject: string;
};

type CreateImportConnectionResponse = {
  id: string;
  type: string;
  resource: {id: string};
};

type CreateImportConnectionResult = {success: true; connectionId: string} | {success: false};

const useCreateImportConnectionHook = () => {
  const {request} = useRequestHook();

  const createImportConnection = async (
    projectId: string,
    payload: CreateImportConnectionPayload,
  ): Promise<CreateImportConnectionResult> => {
    try {
      const response = await request<CreateImportConnectionPayload, CreateImportConnectionResponse>({
        type: RequestMethod.POST,
        endpoint: `/api/project/${projectId}/import/connection`,
        data: payload,
      });

      return {success: true, connectionId: response.data.resource.id};
    } catch (error) {
      if (isAxiosError(error)) {
        toastService.push('error', getApiErrorMessage(error, "Couldn't connect — check the URL and token."));
        return {success: false};
      }
      throw error;
    }
  };

  return {createImportConnection};
};

export default useCreateImportConnectionHook;
