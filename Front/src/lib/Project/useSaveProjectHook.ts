import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {eventBus} from '../EventBus/EventBus';
import {ProjectSaveFailedEvent} from './Event/ProjectSaveFailedEvent';
import {ProjectWasCreatedEvent} from './Event/ProjectWasCreatedEvent';
import {ProjectWasSavedEvent} from './Event/ProjectWasSavedEvent';
import {projectCache} from './ProjectCache';
import type {Project, SaveProjectErrorResponse, SaveProjectResult} from './Type/types';

type SaveProjectOptions = {
  // ProjectWasCreatedEvent drives the sidebar's live project list (a blind
  // append, see Sidebar.tsx) - it must only fire the first time a project is
  // saved, not on every edit, and the PUT itself can't tell those apart since
  // the id is always client-generated. The caller (which owns the isNew prop)
  // has to say so explicitly.
  isNew?: boolean;
};

// platformDocumentation and subProjects each have their own dedicated
// save endpoint (useSavePlatformDocumentationHook, useSaveSubProjectDocumentationHook)
// and are versioned/managed independently there - this generic project save
// must not also push them, or it'd clobber/duplicate what those own.
type SaveProjectPayload = Omit<Project, 'platformDocumentation' | 'subProjects'>;

const useSaveProjectHook = () => {
  const {request} = useRequestHook();

  const saveProject = async (project: Project, options: SaveProjectOptions = {}): Promise<SaveProjectResult> => {
    const {platformDocumentation: _platformDocumentation, subProjects: _subProjects, ...payload} = project;

    try {
      await request<SaveProjectPayload, void>({
        type: RequestMethod.PUT,
        endpoint: `/api/project/${project.id}`,
        data: payload,
      });

      projectCache.set(project);

      if (options.isNew) {
        eventBus.dispatch(new ProjectWasCreatedEvent(project));
      } else {
        eventBus.dispatch(new ProjectWasSavedEvent('Project saved.'));
      }

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

  return {saveProject};
};

export default useSaveProjectHook;
