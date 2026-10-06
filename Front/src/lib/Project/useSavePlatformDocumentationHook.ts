import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {eventBus} from '../EventBus/EventBus';
import {ProjectSaveFailedEvent} from './Event/ProjectSaveFailedEvent';
import {ProjectWasSavedEvent} from './Event/ProjectWasSavedEvent';
import {projectCache} from './ProjectCache';
import type {PlatformDocumentation, Project, SaveProjectErrorResponse, SaveProjectResult} from './Type/types';

// Platform Documentation gets its own save hook/endpoint rather than going
// through the generic whole-project save, since it's versioned and edited
// independently of the rest of the project.
const useSavePlatformDocumentationHook = () => {
  const {request} = useRequestHook();

  const savePlatformDocumentation = async (
    project: Project,
    platformDocumentation: PlatformDocumentation,
  ): Promise<SaveProjectResult> => {
    const updated: Project = {...project, platformDocumentation};

    try {
      await request<PlatformDocumentation, void>({
        type: RequestMethod.PUT,
        endpoint: `/api/project/${project.id}/documentation`,
        data: platformDocumentation,
      });
      projectCache.set(updated);
      eventBus.dispatch(new ProjectWasSavedEvent('Platform Documentation saved.'));
      return {success: true};
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const body = error.response.data as SaveProjectErrorResponse;
        eventBus.dispatch(new ProjectSaveFailedEvent(body.data[0]?.resource.message || "Couldn't save changes — please try again."));
        return {success: false, errors: body.data};
      }
      throw error;
    }
  };

  return {savePlatformDocumentation};
};

export default useSavePlatformDocumentationHook;
