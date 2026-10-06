import type {CollectionResponse} from '@/lib/Request/Type/types';

// See the Git / VCS Integration sub-project's Solution Design + ADR (Catch
// up with Jira project): ingestion is inbound-webhook, not scheduled
// polling, so a connection needs no stored API token of its own - creating
// one just registers a repo + provider and hands back a webhook secret for
// the user to paste into that provider's own webhook settings. The webhook
// URL itself isn't part of this response at all - see buildVcsWebhookUrl,
// it's fully derivable from provider + connectionId and isn't sensitive, so
// it's always visible (unlike the secret, which is a genuine one-time
// reveal - lost it, rotate it, never re-fetch it).
export type VcsProvider = 'GITHUB' | 'GITLAB' | 'BITBUCKET' | 'AZURE_DEVOPS';

export type VcsConnection = {
  id: string;
  provider: VcsProvider;
  repoUrl: string;
};

// Present on the create response and on a rotate-secret response - never on
// a list/get, the backend has no reason to hand a still-valid secret back
// down again afterwards.
export type VcsConnectionCredentials = {
  webhookSecret: string;
};

export type VcsConnectionResponseItem = {
  id: string;
  resource: VcsConnection;
};

export type ListVcsConnectionsResponse = CollectionResponse<VcsConnectionResponseItem>;

export type ListVcsConnectionsResult = {success: true; connections: VcsConnection[]} | {success: false};

export type CreateVcsConnectionResponse = {
  id: string;
  type: string;
  resource: VcsConnection & VcsConnectionCredentials;
};

export type CreateVcsConnectionResult =
  | {success: true; connection: VcsConnection & VcsConnectionCredentials}
  | {success: false};

export type VcsConnectionMutationResult = {success: true} | {success: false};

export type RotateVcsConnectionSecretResponse = {
  id: string;
  type: string;
  resource: VcsConnectionCredentials;
};

export type RotateVcsConnectionSecretResult = {success: true; webhookSecret: string} | {success: false};

export type DevelopmentBranch = {
  name: string;
  lastCommitSha: string;
  lastCommitAt: string;
  url: string;
};

export type DevelopmentCommit = {
  sha: string;
  message: string;
  authorName: string;
  authoredAt: string;
  url: string;
};

export type DevelopmentPullRequest = {
  id: string;
  title: string;
  status: 'OPEN' | 'MERGED' | 'DECLINED';
  approvalsCount: number;
  url: string;
};

// Azure DevOps only, per scope - other providers' response payloads simply
// never populate this array.
export type DevelopmentDeployment = {
  environment: string;
  status: 'SUCCEEDED' | 'FAILED' | 'IN_PROGRESS';
  deployedAt: string;
};

export type DevelopmentActivity = {
  ticketId: string;
  branches: DevelopmentBranch[];
  commits: DevelopmentCommit[];
  pullRequests: DevelopmentPullRequest[];
  deployments: DevelopmentDeployment[];
};

export type GetTicketDevelopmentResponse = {
  id: string;
  type: string;
  resource: DevelopmentActivity;
};

export type GetTicketDevelopmentResult = {success: true; activity: DevelopmentActivity} | {success: false};
