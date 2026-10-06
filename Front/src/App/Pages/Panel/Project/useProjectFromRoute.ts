import {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import useGetProjectHook from '../../../../lib/Project/useGetProjectHook';
import type {Project} from '../../../../lib/Project/Type/types';

type FetchResult = {
  id: string;
  project: Project | null;
  failed: boolean;
};

type State = 'loading' | 'ready' | 'error';

const useProjectFromRoute = () => {
  const {projectId} = useParams<{projectId: string}>();
  const {getProject} = useGetProjectHook();
  const [result, setResult] = useState<FetchResult | null>(null);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    let cancelled = false;

    getProject(projectId).then((response) => {
      if (cancelled) {
        return;
      }

      setResult({
        id: projectId,
        project: response.success ? response.project : null,
        failed: !response.success,
      });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getProject is recreated every render (thin useRequestHook wrapper), including it here would refetch in a loop
  }, [projectId]);

  if (!projectId) {
    return {project: null, state: 'error' as State};
  }

  // Loading is derived, not stored: it's "loading" whenever we haven't yet
  // resolved a fetch for the CURRENT projectId (covers both the initial
  // fetch and navigating from one project to another without unmounting).
  if (!result || result.id !== projectId) {
    return {project: null, state: 'loading' as State};
  }

  return {
    project: result.project,
    state: (result.failed ? 'error' : 'ready') as State,
  };
};

export default useProjectFromRoute;
