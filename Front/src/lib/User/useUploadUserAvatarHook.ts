import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {eventBus} from '../EventBus/EventBus';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {UserAvatarWasUploadedEvent} from './Event/UserAvatarWasUploadedEvent';
import {UserAvatarUploadFailedEvent} from './Event/UserAvatarUploadFailedEvent';

type UploadUserAvatarResult =
  | {success: true}
  | {success: false};

// POST /api/user/avatar/{avatarId}, same multipart-FormData/client-generated-
// id convention as useUploadAttachmentHook. Self only - there's no userId
// anywhere in the request, the backend resolves "whose avatar" from the
// caller's own JWT, so this only ever changes the currently logged-in
// user's avatar (not any other user's - see UserFormPage, which edits other
// users but has no avatar picker for exactly this reason).
const useUploadUserAvatarHook = () => {
  const {request} = useRequestHook();

  const uploadUserAvatar = async (
    avatarId: string,
    file: File,
    onProgress?: (loaded: number, total: number) => void,
  ): Promise<UploadUserAvatarResult> => {
    try {
      const data = new FormData();
      data.append('file', file);

      await request<FormData, void>({
        type: RequestMethod.POST,
        endpoint: `/api/user/avatar/${avatarId}`,
        data,
        onUploadProgress: onProgress ? (event) => onProgress(event.loaded, event.total ?? file.size) : undefined,
      });

      eventBus.dispatch(new UserAvatarWasUploadedEvent('Avatar updated.'));

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        eventBus.dispatch(new UserAvatarUploadFailedEvent(getApiErrorMessage(error, "Couldn't upload the avatar — please try again.")));
        return {success: false};
      }

      throw error;
    }
  };

  return {uploadUserAvatar};
};

export default useUploadUserAvatarHook;
