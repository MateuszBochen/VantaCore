import type {ApplicationSettings, SaveApplicationSettingsResult} from './Type/types';

// No backend endpoint for this exists yet - pure no-op stub until it does,
// so the page already has the right shape (a Promise<SaveApplicationSettingsResult>)
// to swap the body for once it exists:
//
// import {isAxiosError} from 'axios';
// import useRequestHook from '../Request/useRequestHook';
// import {RequestMethod} from '../Request/Type/types';
//
// const {request} = useRequestHook();
//
// const saveSettings = async (settings: ApplicationSettings): Promise<SaveApplicationSettingsResult> => {
//   try {
//     await request<ApplicationSettings, void>({
//       type: RequestMethod.PUT,
//       endpoint: '/api/settings',
//       data: settings,
//     });
//     return {success: true};
//   } catch (error) {
//     if (isAxiosError(error)) {
//       return {success: false};
//     }
//     throw error;
//   }
// };
const useSaveSettingsHook = () => {
  // Stub until the endpoint exists (see commented-out implementation above) -
  // `settings` is accepted now so call sites already pass the right shape.
  const saveSettings = async (settings: ApplicationSettings): Promise<SaveApplicationSettingsResult> => {
    void settings;
    return {success: true};
  };

  return {saveSettings};
};

export default useSaveSettingsHook;