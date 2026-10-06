import {useEffect, useState} from 'react';
import {Link, RefreshCw, Trash2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Select} from '@/components/ui/select';
import {CopyButton} from '@/components/ui/copy-button';
import useListVcsConnectionsHook from '@/lib/Vcs/useListVcsConnectionsHook';
import useCreateVcsConnectionHook from '@/lib/Vcs/useCreateVcsConnectionHook';
import useDeleteVcsConnectionHook from '@/lib/Vcs/useDeleteVcsConnectionHook';
import useRotateVcsConnectionSecretHook from '@/lib/Vcs/useRotateVcsConnectionSecretHook';
import buildVcsWebhookUrl from '@/lib/Vcs/buildVcsWebhookUrl';
import type {VcsConnection, VcsProvider} from '@/lib/Vcs/Type/types';

const PROVIDER_OPTIONS: {value: VcsProvider; label: string}[] = [
  {value: 'GITHUB', label: 'GitHub'},
  {value: 'GITLAB', label: 'GitLab'},
  {value: 'BITBUCKET', label: 'Bitbucket'},
  {value: 'AZURE_DEVOPS', label: 'Azure DevOps'},
];

const PROVIDER_LABEL: Record<VcsProvider, string> = {
  GITHUB: 'GitHub',
  GITLAB: 'GitLab',
  BITBUCKET: 'Bitbucket',
  AZURE_DEVOPS: 'Azure DevOps',
};

type RevealedSecret = {
  connectionId: string;
  secret: string;
};

type VcsIntegrationSectionProps = {
  projectId: string;
};

// A project can connect any number of repos, even mixing providers - see
// VcsConnection's shape (a list, not a singleton) and the sub-project's own
// scope ("connection to one or more providers").
const VcsIntegrationSection = ({projectId}: VcsIntegrationSectionProps) => {
  const {listVcsConnections} = useListVcsConnectionsHook();
  const {createVcsConnection} = useCreateVcsConnectionHook();
  const {deleteVcsConnection} = useDeleteVcsConnectionHook();
  const {rotateVcsConnectionSecret} = useRotateVcsConnectionSecretHook();

  const [connections, setConnections] = useState<VcsConnection[] | null>(null);
  const [provider, setProvider] = useState<VcsProvider | ''>('');
  const [repoUrl, setRepoUrl] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  // The webhook secret is a genuine one-time reveal (create, or a manual
  // rotate below) - never re-fetchable, unlike the URL itself (see
  // buildVcsWebhookUrl), which is shown on every row regardless.
  const [revealedSecret, setRevealedSecret] = useState<RevealedSecret | null>(null);

  useEffect(() => {
    let cancelled = false;

    listVcsConnections(projectId).then((result) => {
      if (!cancelled && result.success) {
        setConnections(result.connections);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listVcsConnections is a thin useRequestHook wrapper recreated every render
  }, [projectId]);

  const handleConnect = () => {
    if (!provider || !repoUrl.trim()) {
      return;
    }

    setConnecting(true);

    createVcsConnection(projectId, {provider, repoUrl: repoUrl.trim()})
      .then((result) => {
        if (!result.success) {
          return;
        }

        setConnections((current) => [...(current ?? []), result.connection]);
        setRevealedSecret({connectionId: result.connection.id, secret: result.connection.webhookSecret});
        setProvider('');
        setRepoUrl('');
      })
      .finally(() => setConnecting(false));
  };

  const handleRotateSecret = (connectionId: string) => {
    setRotatingId(connectionId);

    rotateVcsConnectionSecret(projectId, connectionId)
      .then((result) => {
        if (result.success) {
          setRevealedSecret({connectionId, secret: result.webhookSecret});
        }
      })
      .finally(() => setRotatingId(null));
  };

  const handleDeleteClick = (connectionId: string) => {
    if (confirmingId !== connectionId) {
      setConfirmingId(connectionId);
      return;
    }

    setConfirmingId(null);
    setDeletingId(connectionId);

    deleteVcsConnection(projectId, connectionId)
      .then((result) => {
        if (result.success) {
          setConnections((current) => (current ?? []).filter((connection) => connection.id !== connectionId));
          if (revealedSecret?.connectionId === connectionId) {
            setRevealedSecret(null);
          }
        }
      })
      .finally(() => setDeletingId(null));
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold text-foreground">Git / VCS Integration</p>
      <p className="text-sm text-muted-foreground">
        Connect any number of repositories, across any of these providers. Branches, commits and pull requests get linked to a ticket
        automatically the moment its key (e.g. {'"'}{`{prefix}-123`}{'"'}) shows up in a branch name, commit message, or PR title.
      </p>

      {connections === null ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : connections.length === 0 ? (
        <p className="text-sm text-muted-foreground">No repositories connected yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {connections.map((connection) => (
            <div key={connection.id} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {PROVIDER_LABEL[connection.provider]}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{connection.repoUrl}</span>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                  loading={rotatingId === connection.id}
                  onClick={() => handleRotateSecret(connection.id)}
                >
                  Regenerate secret
                </Button>
                <Button
                  variant={confirmingId === connection.id ? 'destructive' : 'outline'}
                  size="sm"
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  loading={deletingId === connection.id}
                  onClick={() => handleDeleteClick(connection.id)}
                >
                  {confirmingId === connection.id ? 'Confirm delete?' : 'Delete'}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">Webhook URL</span>
                <code className="min-w-0 flex-1 truncate rounded-lg bg-muted px-2.5 py-1 text-xs text-foreground">
                  {buildVcsWebhookUrl(connection.provider, connection.id)}
                </code>
                <CopyButton value={buildVcsWebhookUrl(connection.provider, connection.id)} />
              </div>

              {revealedSecret?.connectionId === connection.id && (
                <div className="flex flex-col gap-2 rounded-lg border border-accent/40 bg-accent/5 p-3">
                  <p className="text-xs text-foreground">
                    Paste this into that repository{"'"}s webhook settings now — it{"'"}s shown once and can{"'"}t be viewed again
                    afterwards (only regenerated, which invalidates this one).
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="w-14 shrink-0 text-xs text-muted-foreground">Secret</span>
                    <code className="min-w-0 flex-1 truncate rounded-lg bg-muted px-2.5 py-1 text-xs text-foreground">
                      {revealedSecret.secret}
                    </code>
                    <CopyButton value={revealedSecret.secret} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Provider</label>
          <Select className="w-40" value={provider} onValueChange={(value) => setProvider(value as VcsProvider)} options={PROVIDER_OPTIONS} placeholder="Provider" />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Repository URL</label>
          <Input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/org/repo" />
        </div>
        <Button leftIcon={<Link className="h-4 w-4" />} onClick={handleConnect} loading={connecting} disabled={!provider || !repoUrl.trim()}>
          Connect
        </Button>
      </div>
    </div>
  );
};

export default VcsIntegrationSection;
