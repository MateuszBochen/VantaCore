import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {eventBus} from '../EventBus/EventBus';
import {getApiErrorMessage} from '../Request/getApiErrorMessage';
import {ReleaseWasSavedEvent} from './Event/ReleaseWasSavedEvent';
import {ReleaseSaveFailedEvent} from './Event/ReleaseSaveFailedEvent';
import type {SaveReleasePayload, SaveReleaseResult} from './Type/types';

type SaveReleaseOptions = {
  isNew?: boolean;
};

// PUT /api/project/{projectId}/release/{releaseId} - confirmed spec
// 2026-08-16. No POST endpoint exists, so creating a new version reuses
// this same PUT as an upsert: the caller (VersionTrackerPage) generates a
// fresh releaseId with crypto.randomUUID() (see createDraftRelease) and
// sends it here exactly like an update - confirmed with the user 2026-08-16
// as the intended approach until/unless a dedicated POST shows up.
const useSaveReleaseHook = () => {
  const {request} = useRequestHook();

  const saveRelease = async (projectId: string, releaseId: string, payload: SaveReleasePayload, options: SaveReleaseOptions = {}): Promise<SaveReleaseResult> => {
    try {
      await request<SaveReleasePayload, void>({
        type: RequestMethod.PUT,
        endpoint: `/api/project/${projectId}/release/${releaseId}`,
        data: payload,
      });

      eventBus.dispatch(new ReleaseWasSavedEvent(options.isNew ? 'Version created.' : 'Version saved.'));

      return {success: true};
    } catch (error) {
      if (isAxiosError(error)) {
        eventBus.dispatch(new ReleaseSaveFailedEvent(getApiErrorMessage(error, "Couldn't save this version — please try again.")));
        return {success: false};
      }

      throw error;
    }
  };

  return {saveRelease};
};

export default useSaveReleaseHook;
