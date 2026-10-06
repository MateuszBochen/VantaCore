import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import {projectCache} from './ProjectCache';
import type {
  GetProjectResponse,
  GetProjectResult,
  ListSubProjectsResponse,
  PlatformDocumentation,
  Project,
} from './Type/types';

// What the backend actually sends for a project saved before `platformDocumentation`
// (or one of its fields) or `subProjects` existed - unlike `Project`, these
// fields may be partial or absent, which is exactly what `withDefaults` normalizes.
type StoredProject = Omit<Project, 'platformDocumentation' | 'subProjects' | 'flags' | 'customFieldDefinitions' | 'statuses'> & {
  platformDocumentation?: Partial<PlatformDocumentation>;
  subProjects?: Project['subProjects'];
  flags?: Project['flags'];
  customFieldDefinitions?: Project['customFieldDefinitions'];
  statuses?: Project['statuses'];
};

// Default per-field (not all-or-nothing) so every consumer can rely on the
// whole shape always being present, instead of guarding at every read site.
const withDefaults = (project: StoredProject): Project => ({
  ...project,
  flags: project.flags ?? [],
  customFieldDefinitions: project.customFieldDefinitions ?? [],
  statuses: project.statuses ?? [],
  platformDocumentation: {
    architectureOverview: '',
    api: '',
    domains: [],
    domainEdges: [],
    boundedContexts: [],
    boundedContextEdges: [],
    components: [],
    componentEdges: [],
    dataFlowNodes: [],
    dataFlowEdges: [],
    infraClusters: [],
    infraClusterEdges: [],
    infraServices: [],
    infraServiceEdges: [],
    ...project.platformDocumentation,
  },
  subProjects: project.subProjects ?? [],
});

// Platform Documentation lives behind its own endpoint now. An unsaved
// project has no version yet, so the backend returns an all-null placeholder
// there rather than 404ing - every field must be nullish-coalesced individually
// (a blind spread would let an explicit `null` clobber the default).
type PlatformDocumentationResource = {
  [K in keyof PlatformDocumentation]: PlatformDocumentation[K] | null;
};

type GetPlatformDocumentationResponse = {
  id: string;
  type: string;
  resource: PlatformDocumentationResource;
};

const withPlatformDocumentationDefaults = (resource: PlatformDocumentationResource): PlatformDocumentation => ({
  architectureOverview: resource.architectureOverview ?? '',
  api: resource.api ?? '',
  domains: resource.domains ?? [],
  domainEdges: resource.domainEdges ?? [],
  boundedContexts: resource.boundedContexts ?? [],
  boundedContextEdges: resource.boundedContextEdges ?? [],
  components: resource.components ?? [],
  componentEdges: resource.componentEdges ?? [],
  dataFlowNodes: resource.dataFlowNodes ?? [],
  dataFlowEdges: resource.dataFlowEdges ?? [],
  infraClusters: resource.infraClusters ?? [],
  infraClusterEdges: resource.infraClusterEdges ?? [],
  infraServices: resource.infraServices ?? [],
  infraServiceEdges: resource.infraServiceEdges ?? [],
});

const useGetProjectHook = () => {
  const {request} = useRequestHook();

  const getProject = async (id: string): Promise<GetProjectResult> => {
    const cached = projectCache.get(id);

    if (cached) {
      return {success: true, project: withDefaults(cached)};
    }

    try {
      const [projectResponse, documentationResponse, subProjectsResponse] = await Promise.all([
        request<undefined, GetProjectResponse>({
          type: RequestMethod.GET,
          endpoint: `/api/project/${id}`,
        }),
        request<undefined, GetPlatformDocumentationResponse>({
          type: RequestMethod.GET,
          endpoint: `/api/project/${id}/documentation`,
        }),
        request<undefined, ListSubProjectsResponse>({
          type: RequestMethod.GET,
          endpoint: `/api/project/${id}/sub-project`,
        }),
      ]);

      const project: Project = {
        ...withDefaults(projectResponse.data.resource),
        platformDocumentation: withPlatformDocumentationDefaults(documentationResponse.data.resource),
        subProjects: subProjectsResponse.data.data.map((item) => item.resource),
      };

      projectCache.set(project);

      return {success: true, project};
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {getProject};
};

export default useGetProjectHook;
