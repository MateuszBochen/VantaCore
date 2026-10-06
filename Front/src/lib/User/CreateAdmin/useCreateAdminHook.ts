import {isAxiosError} from 'axios';
import useRequestHook from '../../Request/useRequestHook';
import {RequestMethod} from '../../Request/Type/types';
import {eventBus} from '../../EventBus/EventBus';
import {AdminWasCreatedEvent} from './Event/AdminWasCreatedEvent';
import type {CreateAdminErrorResponse, CreateAdminRequestData, CreateAdminResult} from './Type/types';

const useCreateAdminHook = () => {
  const {request} = useRequestHook();

  const createAdmin = async (data: CreateAdminRequestData): Promise<CreateAdminResult> => {
    try {
      await request<CreateAdminRequestData, void>({
        type: RequestMethod.POST,
        endpoint: '/web-api/user/admin',
        data,
      });

      eventBus.dispatch(new AdminWasCreatedEvent(data.email));

      return {success: true};
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const body = error.response.data as CreateAdminErrorResponse;

        return {success: false, errors: body.data};
      }

      throw error;
    }
  };

  return {createAdmin};
};

export default useCreateAdminHook;