import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {toastService} from '../Toast/ToastService';
import type {ImportFieldMapping, ImportValueMapping} from './Type/types';

type CreateImportJobParams =
  | {provider: 'CSV'; file: File; mapping: ImportFieldMapping[]; valueMappings: ImportValueMapping[]}
  | {provider: 'JIRA' | 'AZURE_DEVOPS'; connectionId: string; mapping: ImportFieldMapping[]; valueMappings: ImportValueMapping[]};

type CreateImportJobResponse = {
  id: string;
  type: string;
  resource: {id: string};
};

type CreateImportJobResult = {success: true; importJobId: string} | {success: false};

// One job either way (see ADR: import runs as an async background job) -
// only the request body shape differs. CSV goes multipart since it carries
// an actual file; JIRA/AZURE_DEVOPS is plain JSON since the job pulls the
// real data itself from the already-established connection.
const useCreateImportJobHook = () => {
  const {request} = useRequestHook();

  const createImportJob = async (projectId: string, params: CreateImportJobParams): Promise<CreateImportJobResult> => {
    try {
      const data: FormData | Record<string, unknown> =
        params.provider === 'CSV'
          ? (() => {
              const formData = new FormData();
              formData.append('file', params.file);
              formData.append('provider', params.provider);
              formData.append('mapping', JSON.stringify(params.mapping));
              formData.append('valueMappings', JSON.stringify(params.valueMappings));
              return formData;
            })()
          : {
              provider: params.provider,
              connectionId: params.connectionId,
              mapping: params.mapping,
              valueMappings: params.valueMappings,
            };

      const response = await request<FormData | Record<string, unknown>, CreateImportJobResponse>({
        type: RequestMethod.POST,
        endpoint: `/api/project/${projectId}/import`,
        data,
      });

      return {success: true, importJobId: response.data.resource.id};
    } catch (error) {
      if (isAxiosError(error)) {
        toastService.push('error', getApiErrorMessage(error, "Couldn't start the import — please try again."));
        return {success: false};
      }
      throw error;
    }
  };

  return {createImportJob};
};

export default useCreateImportJobHook;
