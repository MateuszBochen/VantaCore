import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {toastService} from '../Toast/ToastService';
import type {ImportPreview} from './Type/types';

type GetImportConnectionPreviewResponse = {
  id: string;
  type: string;
  resource: ImportPreview;
};

type GetImportConnectionPreviewResult = {success: true; preview: ImportPreview} | {success: false};

// Fields + a handful of sample rows pulled live from the connected Jira/
// Azure DevOps instance - drives MapFieldsStep the same way parseCsvPreview
// does for a CSV file, so both branches feed PreviewStep the exact same
// ImportPreview shape regardless of provider.
const useGetImportConnectionPreviewHook = () => {
  const {request} = useRequestHook();

  const getImportConnectionPreview = async (
    projectId: string,
    connectionId: string,
  ): Promise<GetImportConnectionPreviewResult> => {
    try {
      const response = await request<undefined, GetImportConnectionPreviewResponse>({
        type: RequestMethod.GET,
        endpoint: `/api/project/${projectId}/import/connection/${connectionId}/preview`,
      });

      return {success: true, preview: response.data.resource};
    } catch (error) {
      if (isAxiosError(error)) {
        toastService.push('error', "Couldn't load a preview from this connection.");
        return {success: false};
      }
      throw error;
    }
  };

  return {getImportConnectionPreview};
};

export default useGetImportConnectionPreviewHook;
