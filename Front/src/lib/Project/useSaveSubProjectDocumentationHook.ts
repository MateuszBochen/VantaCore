import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {eventBus} from '../EventBus/EventBus';
import {ProjectSaveFailedEvent} from './Event/ProjectSaveFailedEvent';
import {ProjectWasSavedEvent} from './Event/ProjectWasSavedEvent';
import {projectCache} from './ProjectCache';
import type {Project, SaveProjectErrorResponse, SaveProjectResult, SubProject, SubProjectSummary} from './Type/types';

type SaveSubProjectPayload = {
  name: string;
  documentation: SubProject['documentation'];
};

const useSaveSubProjectDocumentationHook = () => {
  const {request} = useRequestHook();

  // Upsert: this same hook drives both creating a new sub-project (its id
  // isn't in project.subProjects yet) and saving edits to an existing one -
  // PUT is idempotent either way since the id is always client-generated
  // (see createDraftSubProject).
  const saveSubProjectDocumentation = async (project: Project, subProject: SubProject): Promise<SaveProjectResult> => {
    try {
      await request<SaveSubProjectPayload, void>({
        type: RequestMethod.PUT,
        endpoint: `/api/project/${project.id}/sub-project/${subProject.id}`,
        data: {name: subProject.name, documentation: subProject.documentation},
      });

      const exists = project.subProjects.some((candidate) => candidate.id === subProject.id);
      // The list endpoint's `status` isn't known here (it's assigned by the
      // backend) - an existing summary's status is kept as-is, a brand new
      // one falls back to empty until the sidebar's next full reload.
      const existingStatus = project.subProjects.find((candidate) => candidate.id === subProject.id)?.status ?? '';
      const summary: SubProjectSummary = {id: subProject.id, name: subProject.name, status: existingStatus};

      const subProjects = exists
        ? project.subProjects.map((candidate) => (candidate.id === subProject.id ? summary : candidate))
        : [...project.subProjects, summary];

      projectCache.set({...project, subProjects});
      eventBus.dispatch(new ProjectWasSavedEvent('Sub-project documentation saved.'));
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

  return {saveSubProjectDocumentation};
};

export default useSaveSubProjectDocumentationHook;