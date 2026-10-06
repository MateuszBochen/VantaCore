import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {GetTicketDevelopmentResponse, GetTicketDevelopmentResult} from './Type/types';

const useGetTicketDevelopmentHook = () => {
  const {request} = useRequestHook();

  const getTicketDevelopment = async (projectId: string, ticketId: string): Promise<GetTicketDevelopmentResult> => {
    try {
      const response = await request<undefined, GetTicketDevelopmentResponse>({
        type: RequestMethod.GET,
        endpoint: `/api/project/${projectId}/ticket/${ticketId}/development`,
      });

      return {success: true, activity: response.data.resource};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }
      throw error;
    }
  };

  return {getTicketDevelopment};
};

export default useGetTicketDevelopmentHook;
