import {useEffect, useState} from 'react';
import useGetImportJobHook from './useGetImportJobHook';
import type {ImportJob} from './Type/types';

const POLL_INTERVAL_MS = 2000;

// No polling precedent exists elsewhere in the app yet (import is the first
// genuinely long-running async job with a status endpoint - see the ADR) -
// same cancel-on-unmount convention as every other fetch-on-mount hook here
// (useProjectFromRoute, AuditLogPage), just re-scheduled with setTimeout
// instead of firing once, and stopping once the job reaches a terminal
// status instead of after the first response.
const useImportJobPolling = (projectId: string | null, importJobId: string | null) => {
  const {getImportJob} = useGetImportJobHook();
  const [job, setJob] = useState<ImportJob | null>(null);

  useEffect(() => {
    if (!projectId || !importJobId) {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = () => {
      getImportJob(projectId, importJobId).then((result) => {
        if (cancelled || !result.success) {
          return;
        }

        setJob(result.job);

        if (result.job.status === 'PENDING' || result.job.status === 'RUNNING') {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        }
      });
    };

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getImportJob is a thin useRequestHook wrapper recreated every render; re-running this on its identity would restart polling in a loop
  }, [projectId, importJobId]);

  return {job};
};

export default useImportJobPolling;
