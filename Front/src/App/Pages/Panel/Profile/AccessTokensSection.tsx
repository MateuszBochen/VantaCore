import {useEffect, useMemo, useState} from 'react';
import {KeyRound, Plus, Trash2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Select} from '@/components/ui/select';
import {Combobox} from '@/components/ui/combobox';
import {Surface} from '@/components/ui/surface';
import {CopyButton} from '@/components/ui/copy-button';
import useListAccessTokensHook from '@/lib/AccessToken/useListAccessTokensHook';
import useCreateAccessTokenHook from '@/lib/AccessToken/useCreateAccessTokenHook';
import useRevokeAccessTokenHook from '@/lib/AccessToken/useRevokeAccessTokenHook';
import useListRoleResourcesHook from '@/lib/Role/useListRoleResourcesHook';
import type {AccessToken, CreatedAccessToken} from '@/lib/AccessToken/Type/types';
import type {RoleResourceSummary} from '@/lib/Role/Type/types';

const NAME_MAX_LENGTH = 100;

type ExpiryOption = '30' | '90' | '365' | 'never';

const EXPIRY_OPTIONS: {value: ExpiryOption; label: string}[] = [
  {value: '30', label: '30 days'},
  {value: '90', label: '90 days'},
  {value: '365', label: '1 year'},
  {value: 'never', label: 'No expiration'},
];

const expiresAtFor = (option: ExpiryOption): string | null => {
  if (option === 'never') {
    return null;
  }

  const date = new Date();
  date.setDate(date.getDate() + Number(option));
  return date.toISOString();
};

const formatDate = (isoString: string | null): string => {
  if (!isoString) {
    return '—';
  }

  const date = new Date(isoString);
  return Number.isNaN(date.getTime()) ? isoString : date.toLocaleString();
};

// Profile's "Personal access tokens" tab - tokens for MCP clients and
// scripts, acting as the user. The secret is only in the create response,
// so it's revealed once right here (Copy + warning) and gone on reload -
// same "shown once" idiom as WebhooksSection's signing secret, and the same
// click-twice-to-confirm Revoke as its Delete.
const AccessTokensSection = () => {
  const {listAccessTokens} = useListAccessTokensHook();
  const {createAccessToken} = useCreateAccessTokenHook();
  const {revokeAccessToken} = useRevokeAccessTokenHook();
  const {listRoleResources} = useListRoleResourcesHook();

  const [tokens, setTokens] = useState<AccessToken[] | null>(null);
  const [resources, setResources] = useState<RoleResourceSummary[]>([]);

  const [name, setName] = useState('');
  const [expiry, setExpiry] = useState<ExpiryOption>('90');
  const [scope, setScope] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [revealedToken, setRevealedToken] = useState<CreatedAccessToken | null>(null);

  const [confirmingRevokeId, setConfirmingRevokeId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    listAccessTokens().then((result) => {
      if (!cancelled) {
        setTokens(result.success ? result.tokens : []);
      }
    });

    listRoleResources().then((result) => {
      if (!cancelled && result.success) {
        setResources(result.resources);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- thin useRequestHook wrappers recreated every render
  }, []);

  const resourceOptions = useMemo(
    () => resources.map((resource) => ({value: resource.code, label: resource.name})),
    [resources],
  );
  const resourceLabel = (code: string): string => resources.find((resource) => resource.code === code)?.name ?? code;

  const trimmedName = name.trim();
  const canCreate = trimmedName !== '' && trimmedName.length <= NAME_MAX_LENGTH;

  const handleCreate = () => {
    if (!canCreate) {
      return;
    }

    setCreating(true);

    createAccessToken({name: trimmedName, expiresAt: expiresAtFor(expiry), resources: scope.length > 0 ? scope : null})
      .then((result) => {
        if (!result.success) {
          return;
        }

        // The list shape never carries the secret - only revealedToken does.
        const {id, name: createdName, tokenPrefix, resources: createdResources, createdAt, expiresAt} = result.token;
        setTokens((current) => [
          {id, name: createdName, tokenPrefix, resources: createdResources, createdAt, expiresAt, lastUsedAt: null, expired: false},
          ...(current ?? []),
        ]);
        setRevealedToken(result.token);
        setName('');
        setScope([]);
        setExpiry('90');
      })
      .finally(() => setCreating(false));
  };

  const handleRevokeClick = (tokenId: string) => {
    if (confirmingRevokeId !== tokenId) {
      setConfirmingRevokeId(tokenId);
      return;
    }

    setConfirmingRevokeId(null);
    setRevokingId(tokenId);

    revokeAccessToken(tokenId)
      .then((result) => {
        if (result.success) {
          setTokens((current) => (current ?? []).filter((candidate) => candidate.id !== tokenId));
          if (revealedToken?.id === tokenId) {
            setRevealedToken(null);
          }
        }
      })
      .finally(() => setRevokingId(null));
  };

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Tokens let MCP clients and scripts call the VantaCore API as you. Send one as <code>Authorization: Bearer &lt;token&gt;</code>.
        Treat it like a password.
      </p>

      {revealedToken && (
        <div className="flex flex-col gap-2 rounded-lg border border-accent/40 bg-accent/5 p-3">
          <p className="text-xs text-foreground">
            Token <span className="font-medium">{revealedToken.name}</span> created. Copy it now — it{"'"}s shown only once and can{"'"}t
            be viewed again.
          </p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-muted px-2.5 py-1 text-xs text-foreground">{revealedToken.token}</code>
            <CopyButton value={revealedToken.token} />
            <Button variant="ghost" size="sm" onClick={() => setRevealedToken(null)}>
              Done
            </Button>
          </div>
        </div>
      )}

      {tokens === null ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : tokens.length === 0 ? (
        <p className="text-sm text-muted-foreground">No access tokens yet.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
          {tokens.map((token) => (
            <div key={token.id} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-center gap-3">
                <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 truncate text-sm font-medium text-foreground">{token.name}</span>
                <code className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{token.tokenPrefix}…</code>
                {token.expired && (
                  <span className="shrink-0 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-medium text-destructive">Expired</span>
                )}
                <Button
                  variant={confirmingRevokeId === token.id ? 'destructive' : 'outline'}
                  size="sm"
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  loading={revokingId === token.id}
                  onClick={() => handleRevokeClick(token.id)}
                  className="ml-auto"
                >
                  {confirmingRevokeId === token.id ? 'Confirm revoke?' : 'Revoke'}
                </Button>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>Created {formatDate(token.createdAt)}</span>
                <span>Last used {token.lastUsedAt ? formatDate(token.lastUsedAt) : 'never'}</span>
                <span className={token.expired ? 'text-destructive' : undefined}>
                  {token.expiresAt === null ? 'Never expires' : `${token.expired ? 'Expired' : 'Expires'} ${formatDate(token.expiresAt)}`}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {token.resources.length === 0 ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">All your permissions</span>
                ) : (
                  token.resources.map((code) => (
                    <span key={code} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {resourceLabel(code)}
                    </span>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Surface className="flex flex-col gap-3 p-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">New token</p>

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex min-w-64 flex-1 flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={NAME_MAX_LENGTH} placeholder="e.g. Claude MCP on my laptop" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Expiration</label>
            {/* Select is clearable - an emptied value keeps the previous choice. */}
            <Select className="w-44" value={expiry} onValueChange={(value) => value && setExpiry(value as ExpiryOption)} options={EXPIRY_OPTIONS} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Permissions (optional)</label>
          <Combobox
            multiple
            value={scope}
            onValueChange={setScope}
            options={resourceOptions}
            placeholder="All your permissions"
            className="max-w-md"
          />
          <p className="text-xs text-muted-foreground">Leave empty to give the token all of your permissions, or pick a subset to narrow it.</p>
        </div>

        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleCreate} loading={creating} disabled={!canCreate} className="w-fit">
          Create token
        </Button>
      </Surface>
    </div>
  );
};

export default AccessTokensSection;
