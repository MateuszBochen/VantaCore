import {useEffect, useState} from 'react';
import {ExternalLink, GitBranch, GitCommit, GitPullRequest, Rocket} from 'lucide-react';
import useGetTicketDevelopmentHook from '@/lib/Vcs/useGetTicketDevelopmentHook';
import type {DevelopmentActivity} from '@/lib/Vcs/Type/types';

type TicketDevelopmentSectionProps = {
  projectId: string;
  ticketId: string;
};

const PR_STATUS_CLASSES: Record<string, string> = {
  OPEN: 'text-cyan-400',
  MERGED: 'text-emerald-400',
  DECLINED: 'text-destructive',
};

const DEPLOYMENT_STATUS_CLASSES: Record<string, string> = {
  SUCCEEDED: 'text-emerald-400',
  FAILED: 'text-destructive',
  IN_PROGRESS: 'text-amber-400',
};

// Same one-shot fetch-keyed-on-id pattern as TicketWorklogSection/
// TicketCommentsSection - fetched lazily, only while this Stepper step is
// active. Read-only: this never tries to render a diff or PR conversation
// itself, every row just links out to the provider (see Solution Design).
const TicketDevelopmentSection = ({projectId, ticketId}: TicketDevelopmentSectionProps) => {
  const {getTicketDevelopment} = useGetTicketDevelopmentHook();
  const [fetched, setFetched] = useState<{id: string; activity: DevelopmentActivity} | null>(null);

  useEffect(() => {
    let cancelled = false;

    getTicketDevelopment(projectId, ticketId).then((result) => {
      if (!cancelled && result.success) {
        setFetched({id: ticketId, activity: result.activity});
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getTicketDevelopment is a thin useRequestHook wrapper recreated every render
  }, [projectId, ticketId]);

  const loading = fetched?.id !== ticketId;

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const {branches, commits, pullRequests, deployments} = fetched.activity;
  const isEmpty = branches.length === 0 && commits.length === 0 && pullRequests.length === 0 && deployments.length === 0;

  if (isEmpty) {
    return (
      <p className="text-sm text-muted-foreground">
        No linked git activity yet — it shows up here once a branch, commit, or pull request mentions this ticket{"'"}s key.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {branches.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
            <GitBranch className="h-3.5 w-3.5" /> Branches
          </p>
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
            {branches.map((branch) => (
              <a
                key={branch.name}
                href={branch.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted"
              >
                <span className="min-w-0 flex-1 truncate text-foreground">{branch.name}</span>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">{branch.lastCommitSha.slice(0, 7)}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{new Date(branch.lastCommitAt).toLocaleDateString()}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </a>
            ))}
          </div>
        </div>
      )}

      {commits.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
            <GitCommit className="h-3.5 w-3.5" /> Commits
          </p>
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
            {commits.map((commit) => (
              <a
                key={commit.sha}
                href={commit.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted"
              >
                <span className="min-w-0 flex-1 truncate text-foreground">{commit.message}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{commit.authorName}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{new Date(commit.authoredAt).toLocaleDateString()}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </a>
            ))}
          </div>
        </div>
      )}

      {pullRequests.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
            <GitPullRequest className="h-3.5 w-3.5" /> Pull Requests
          </p>
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
            {pullRequests.map((pr) => (
              <a key={pr.id} href={pr.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted">
                <span className={`shrink-0 text-xs font-semibold ${PR_STATUS_CLASSES[pr.status]}`}>{pr.status}</span>
                <span className="min-w-0 flex-1 truncate text-foreground">{pr.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {pr.approvalsCount} approval{pr.approvalsCount === 1 ? '' : 's'}
                </span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </a>
            ))}
          </div>
        </div>
      )}

      {deployments.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
            <Rocket className="h-3.5 w-3.5" /> Deployments
          </p>
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
            {deployments.map((deployment, index) => (
              <div key={index} className="flex items-center gap-3 px-4 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate text-foreground">{deployment.environment}</span>
                <span className={`shrink-0 text-xs font-semibold ${DEPLOYMENT_STATUS_CLASSES[deployment.status]}`}>{deployment.status}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{new Date(deployment.deployedAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDevelopmentSection;
