import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {GetUserResponse, GetUserResult} from './Type/types';

// GET /api/user/{userId} - the single-user detail endpoint UserFormPage's
// edit mode needs (unlike Board/Sprint, this exists from the start, so no
// list-and-filter workaround is needed here).
const useGetUserHook = () => {
  const {request} = useRequestHook();

  const getUser = async (userId: string): Promise<GetUserResult> => {
    try {
      const response = await request<undefined, GetUserResponse>({
        type: RequestMethod.GET,
        endpoint: `/api/user/${userId}`,
      });

      return {success: true, user: response.data.resource};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {getUser};
};

export default useGetUserHook;
