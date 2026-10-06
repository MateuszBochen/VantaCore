import {useState} from 'react';
import {useParams} from 'react-router-dom';
import {ArrowRight, ExternalLink, Link} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import useCreateImportConnectionHook from '@/lib/ImportExport/useCreateImportConnectionHook';
import useGetImportConnectionPreviewHook from '@/lib/ImportExport/useGetImportConnectionPreviewHook';
import parseCsvPreview from '@/lib/ImportExport/parseCsvPreview';
import type {ImportPreview, ImportProvider} from '@/lib/ImportExport/Type/types';

const PROVIDERS: {value: ImportProvider; label: string; description: string}[] = [
  {value: 'CSV', label: 'CSV file', description: 'Upload a CSV export from any tool. Fields only — no attachments.'},
  {
    value: 'JIRA',
    label: 'Jira',
    description: 'Connect with your Jira site, one project key, and an API token. Pulls that project\'s issues and attachments directly.',
  },
  {
    value: 'AZURE_DEVOPS',
    label: 'Azure DevOps',
    description: 'Connect with your organization, one project, and a Personal Access Token. Pulls that project\'s work items and attachments directly.',
  },
];

// Step-by-step, per provider - where to actually get the credential this
// form asks for. The exact wording/depth of each provider's own account
// menu shifts over time and isn't something this app controls (confirmed
// wrong once already for Jira's menu) - so the direct link is the primary,
// reliable instruction, and the in-app click path is only a rough fallback
// description for anyone who'd rather navigate manually.
const CREDENTIAL_INSTRUCTIONS: Record<'JIRA' | 'AZURE_DEVOPS', {steps: string[]; linkLabel: string; linkUrl: string; scopeNote: string}> = {
  JIRA: {
    steps: [
      'Easiest: use the link below — it opens the API tokens page directly.',
      'Manually: click your avatar (top right) → "Manage account settings" → opens your Atlassian profile → go to its Security tab → "Create and manage API tokens".',
      'Click "Create API token", give it a label (e.g. "VantaCore import"), then copy the token — it\'s shown once.',
      'Enter the email address you log into Jira with below, alongside that token.',
    ],
    linkLabel: 'Open Atlassian API token settings',
    linkUrl: 'https://id.atlassian.com/manage-profile/security/api-tokens',
    scopeNote: 'The token inherits whatever the account itself can see — there\'s no separate scope picker for it.',
  },
  AZURE_DEVOPS: {
    steps: [
      'Easiest: use the link below — it opens the personal access tokens page directly (once you\'re on it, pick your organization from the top-right selector if it doesn\'t default to the right one).',
      'Manually: click your profile icon (top right) → "Personal access tokens".',
      'Click "+ New Token", give it a name and an expiration.',
      'Under Scopes, select "Work Items" → Read (that\'s all this needs), then Create and copy the token — it\'s shown once.',
    ],
    linkLabel: 'Open Azure DevOps personal access tokens',
    linkUrl: 'https://dev.azure.com/_usersSettings/tokens',
    scopeNote: 'Only the "Work Items - Read" scope is required — no need to grant Code or anything else.',
  },
};

// baseUrl only identifies the Jira site / Azure DevOps organization, which
// can host several projects - this scopes the import to exactly one of
// them, so a single-project import doesn't have to mean "connect the whole
// site and hope the mapping step lets you filter it out" (it doesn't).
const PROJECT_FIELD: Record<'JIRA' | 'AZURE_DEVOPS', {label: string; placeholder: string; help: string}> = {
  JIRA: {
    label: 'Jira project key',
    placeholder: 'PROJ',
    help: 'The short code in front of every issue number in that project, e.g. "PROJ" in PROJ-123. Also visible in the project\'s own URL and in Project settings → Details.',
  },
  AZURE_DEVOPS: {
    label: 'Azure DevOps project',
    placeholder: 'My Project',
    help: 'The project name as it appears right after your organization in its URL, e.g. "My Project" in dev.azure.com/your-org/My%20Project.',
  },
};

type SourceStepProps = {
  provider: ImportProvider | null;
  onProviderChange: (provider: ImportProvider) => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
  onReady: (preview: ImportPreview, connectionId: string | null) => void;
};

const SourceStep = ({provider, onProviderChange, file, onFileChange, onReady}: SourceStepProps) => {
  const {projectId} = useParams<{projectId: string}>();
  const {createImportConnection} = useCreateImportConnectionHook();
  const {getImportConnectionPreview} = useGetImportConnectionPreviewHook();
  const [baseUrl, setBaseUrl] = useState('');
  const [sourceProject, setSourceProject] = useState('');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [parsingFile, setParsingFile] = useState(false);

  const handleUseCsv = () => {
    if (!file) {
      return;
    }

    setParsingFile(true);
    parseCsvPreview(file)
      .then((preview) => onReady(preview, null))
      .finally(() => setParsingFile(false));
  };

  const handleConnect = () => {
    const requiresEmail = provider === 'JIRA';

    if (
      !projectId ||
      provider === 'CSV' ||
      !provider ||
      !baseUrl.trim() ||
      !sourceProject.trim() ||
      !token.trim() ||
      (requiresEmail && !email.trim())
    ) {
      return;
    }

    setConnecting(true);

    createImportConnection(projectId, {
      provider,
      baseUrl: baseUrl.trim(),
      sourceProject: sourceProject.trim(),
      token: token.trim(),
      email: requiresEmail ? email.trim() : undefined,
    })
      .then((result) => {
        if (!result.success) {
          return;
        }

        return getImportConnectionPreview(projectId, result.connectionId).then((previewResult) => {
          if (previewResult.success) {
            onReady(previewResult.preview, result.connectionId);
          }
        });
      })
      .finally(() => setConnecting(false));
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">Where are you importing tickets from?</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {PROVIDERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onProviderChange(option.value)}
            className={`flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors ${
              provider === option.value ? 'border-accent/60 bg-accent/10' : 'border-border bg-card hover:border-accent/30'
            }`}
          >
            <span className="text-sm font-semibold text-foreground">{option.label}</span>
            <span className="text-xs text-muted-foreground">{option.description}</span>
          </button>
        ))}
      </div>

      {provider === 'CSV' && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-accent/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent"
          />
          <Button leftIcon={<ArrowRight className="h-4 w-4" />} onClick={handleUseCsv} loading={parsingFile} disabled={!file} className="w-fit">
            Continue
          </Button>
        </div>
      )}

      {(provider === 'JIRA' || provider === 'AZURE_DEVOPS') && (
        <div className="flex max-w-md flex-col gap-4 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Where to get {provider === 'JIRA' ? 'an API token' : 'a Personal Access Token'}
            </p>
            <ol className="flex list-decimal flex-col gap-1 pl-4 text-xs text-muted-foreground">
              {CREDENTIAL_INSTRUCTIONS[provider].steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
            <p className="text-xs text-muted-foreground">{CREDENTIAL_INSTRUCTIONS[provider].scopeNote}</p>
            <a
              href={CREDENTIAL_INSTRUCTIONS[provider].linkUrl}
              target="_blank"
              rel="noreferrer"
              className="flex w-fit items-center gap-1.5 text-xs text-accent hover:underline"
            >
              {CREDENTIAL_INSTRUCTIONS[provider].linkLabel}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">{provider === 'JIRA' ? 'Jira base URL' : 'Azure DevOps organization URL'}</label>
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={provider === 'JIRA' ? 'https://your-team.atlassian.net' : 'https://dev.azure.com/your-org'}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">{PROJECT_FIELD[provider].label}</label>
            <Input value={sourceProject} onChange={(e) => setSourceProject(e.target.value)} placeholder={PROJECT_FIELD[provider].placeholder} />
            <p className="text-xs text-muted-foreground">{PROJECT_FIELD[provider].help}</p>
          </div>

          {provider === 'JIRA' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Account email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">{provider === 'JIRA' ? 'API token' : 'Personal Access Token'}</label>
            <Input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="••••••••••••" />
          </div>

          <Button
            leftIcon={<Link className="h-4 w-4" />}
            onClick={handleConnect}
            loading={connecting}
            disabled={!baseUrl.trim() || !sourceProject.trim() || !token.trim() || (provider === 'JIRA' && !email.trim())}
            className="w-fit"
          >
            Connect and continue
          </Button>
        </div>
      )}
    </div>
  );
};

export default SourceStep;
