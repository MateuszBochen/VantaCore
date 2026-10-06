import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {toastService} from '../Toast/ToastService';
import type {SaveUserSettingsResult, UserSettings} from './Type/types';

// Full overwrite, not a per-key PATCH - see UserSettings' own comment.
// Callers are responsible for merging their one key into the latest known
// blob before calling this (see useTicketLayoutPreference); this hook has
// no opinion on which keys exist.
const useSaveUserSettingsHook = () => {
  const {request} = useRequestHook();

  const saveUserSettings = async (settings: UserSettings): Promise<SaveUserSettingsResult> => {
    try {
      await request<UserSettings, void>({
        type: RequestMethod.PUT,
        endpoint: '/api/user-settings',
        data: settings,
      });

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        toastService.push('error', getApiErrorMessage(error, "Couldn't save your settings — please try again."));
        return {success: false};
      }

      throw error;
    }
  };

  return {saveUserSettings};
};

export default useSaveUserSettingsHook;
