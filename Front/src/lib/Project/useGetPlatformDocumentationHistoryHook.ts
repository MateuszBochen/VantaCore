import {isAxiosError} from 'axios';
import useRequestHook from '../Request/useRequestHook';
import {RequestMethod} from '../Request/Type/types';
import type {PlatformDocumentation, PlatformDocumentationVersion} from './Type/types';

// Same nullable-placeholder shape as the live documentation resource, plus
// the version metadata this endpoint adds.
type PlatformDocumentationVersionResource = {
  [K in keyof PlatformDocumentation]: PlatformDocumentation[K] | null;
} & {
  versionId: string;
  changedByUserId: string;
  changedByEmail: string;
  changedAt: string;
};

type GetPlatformDocumentationHistoryResponse = {
  id: string;
  type: string;
  resource: PlatformDocumentationVersionResource;
};

export type GetPlatformDocumentationHistoryResult =
  | {success: true; version: PlatformDocumentationVersion}
  | {success: false};

const useGetPlatformDocumentationHistoryHook = () => {
  const {request} = useRequestHook();

  // `before` is exclusive - the backend returns the single most recent
  // version strictly older than it. Pass "now" to get the latest saved
  // version, or a version's own `changedAt` to step back one further.
  const getPlatformDocumentationHistory = async (
    projectId: string,
    before: Date,
  ): Promise<GetPlatformDocumentationHistoryResult> => {
    try {
      const response = await request<undefined, GetPlatformDocumentationHistoryResponse>({
        type: RequestMethod.GET,
        endpoint: `/api/project/${projectId}/documentation/history`,
        query: {before: before.toISOString()},
      });

      const {resource} = response.data;

      return {
        success: true,
        version: {
          versionId: resource.versionId,
          changedByUserId: resource.changedByUserId,
          changedByEmail: resource.changedByEmail,
          changedAt: resource.changedAt,
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
        },
      };
    } catch (error) {
      if (isAxiosError(error)) {
        return {success: false};
      }

      throw error;
    }
  };

  return {getPlatformDocumentationHistory};
};

export default useGetPlatformDocumentationHistoryHook;