import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import type {DocumentationAskAnswer} from './Type/types';

type AskDocumentationResponse = {
  id: string;
  resource: DocumentationAskAnswer;
};

export type AskDocumentationResult = {success: true; answer: DocumentationAskAnswer} | {success: false; message: string};

const useAskDocumentationHook = () => {
  const {request} = useRequestHook();

  const askDocumentation = async (projectId: string, question: string): Promise<AskDocumentationResult> => {
    try {
      const response = await request<{question: string}, AskDocumentationResponse>({
        type: RequestMethod.POST,
        endpoint: `/api/project/${projectId}/documentation/ask`,
        data: {question},
      });

      return {success: true, answer: response.data.resource};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false, message: getApiErrorMessage(error, "Couldn't get an answer right now — please try again.")};
      }

      throw error;
    }
  };

  return {askDocumentation};
};

export default useAskDocumentationHook;
