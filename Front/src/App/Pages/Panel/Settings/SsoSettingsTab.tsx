import {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {CopyButton} from '@/components/ui/copy-button';
import {Surface} from '@/components/ui/surface';
import Stepper from '@/components/ui/Stepper';
import {toastService} from '@/lib/Toast/ToastService';
import useListSsoSettingsHook from '@/lib/Sso/useListSsoSettingsHook';
import useSaveSsoProviderHook from '@/lib/Sso/useSaveSsoProviderHook';
import buildSsoRedirectUri from '@/lib/Sso/buildSsoRedirectUri';
import SsoProviderForm from '../../../Form/SsoProviderForm/SsoProviderForm';
import type {SsoProviderFormData, SsoProviderFormRef} from '../../../Form/SsoProviderForm/types';
import type {SsoProvider, SsoProviderSettings} from '@/lib/Sso/Type/types';

type ProviderMeta = {
  provider: SsoProvider;
  name: string;
  accounts: string;
  // Where to create the app whose Client ID/secret go into the form.
  setup: string;
};

// Microsoft first - the main one for company sign-in.
const PROVIDERS: ProviderMeta[] = [
  {
    provider: 'MICROSOFT',
    name: 'Microsoft',
    accounts: 'Entra ID (Azure AD) work and school accounts',
    setup:
      'Azure portal → Microsoft Entra ID → App registrations → New registration. Add the redirect URI below as a "Web" platform, then create a client secret under Certificates & secrets.',
  },
  {
    provider: 'GOOGLE',
    name: 'Google',
    accounts: 'Google Workspace and Gmail accounts',
    setup:
      'Google Cloud console → APIs & Services → Credentials → Create credentials → OAuth client ID (Web application). Add the redirect URI below as an authorized redirect URI.',
  },
  {
    provider: 'GITHUB',
    name: 'GitHub',
    accounts: 'GitHub accounts with a verified email',
    setup: 'GitHub → Settings → Developer settings → OAuth Apps → New OAuth App. Use the redirect URI below as the Authorization callback URL.',
  },
  {
    provider: 'OIDC',
    name: 'OpenID Connect',
    accounts: 'Any other OpenID Connect provider - Okta, Keycloak, Auth0, ...',
    setup:
      "In your provider's admin console, create an OpenID Connect web application with the redirect URI below, then copy its client ID and secret and the provider's issuer URL here.",
  },
];

const emptySettings = (provider: SsoProvider): SsoProviderSettings => ({
  provider,
  enabled: false,
  clientId: '',
  clientSecretSet: false,
  tenantId: provider === 'MICROSOFT' ? '' : null,
  issuerUrl: provider === 'OIDC' ? '' : null,
  displayName: provider === 'OIDC' ? '' : null,
});

// The secret field always starts empty - the stored one is never sent back.
const toFormData = (settings: SsoProviderSettings): SsoProviderFormData => ({
  enabled: settings.enabled,
  clientId: settings.clientId,
  clientSecret: '',
  tenantId: settings.tenantId ?? '',
  issuerUrl: settings.issuerUrl ?? '',
  displayName: settings.displayName ?? '',
});

const StatusPill = ({settings}: {settings: SsoProviderSettings}) => {
  const configured = settings.clientId !== '' && settings.clientSecretSet;
  const [label, className] = settings.enabled
    ? ['Enabled', 'bg-emerald-400/10 text-emerald-400']
    : configured
      ? ['Disabled', 'bg-muted text-muted-foreground']
      : ['Not configured', 'bg-muted text-muted-foreground'];

  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>{label}</span>;
};

type ProviderCardHandle = {
  submit: () => void;
};

type ProviderCardProps = {
  meta: ProviderMeta;
  settings: SsoProviderSettings;
  onSavingChange: (saving: boolean) => void;
  onSaved: (settings: SsoProviderSettings) => void;
};

// Submitted from the settings page's own Save (through SsoSettingsTab's
// ref), same as the AI Agent form - no per-card button.
const ProviderCard = forwardRef<ProviderCardHandle, ProviderCardProps>(({meta, settings, onSavingChange, onSaved}, ref) => {
  const formRef = useRef<SsoProviderFormRef>(null);
  const {saveSsoProvider} = useSaveSsoProviderHook();
  const [saving, setSaving] = useState(false);
  const redirectUri = buildSsoRedirectUri(meta.provider);

  useImperativeHandle(ref, () => ({
    submit() {
      formRef.current?.submit();
    },
  }));

  const setSavingState = (next: boolean) => {
    setSaving(next);
    onSavingChange(next);
  };

  const handleSubmit = (data: SsoProviderFormData) => {
    setSavingState(true);

    saveSsoProvider(meta.provider, {
      enabled: data.enabled,
      clientId: data.clientId,
      clientSecret: data.clientSecret === '' ? null : data.clientSecret,
      tenantId: meta.provider === 'MICROSOFT' ? data.tenantId : null,
      issuerUrl: meta.provider === 'OIDC' ? data.issuerUrl : null,
      displayName: meta.provider === 'OIDC' ? data.displayName : null,
    })
      .then((result) => {
        if (!result.success) {
          toastService.push('error', result.message);
          return;
        }

        toastService.push('success', `${meta.name} sign-in settings saved.`);
        onSaved({
          provider: meta.provider,
          enabled: data.enabled,
          clientId: data.clientId,
          clientSecretSet: settings.clientSecretSet || data.clientSecret !== '',
          tenantId: meta.provider === 'MICROSOFT' ? data.tenantId : null,
          issuerUrl: meta.provider === 'OIDC' ? data.issuerUrl : null,
          displayName: meta.provider === 'OIDC' ? data.displayName : null,
        });
      })
      .finally(() => setSavingState(false));
  };

  return (
    <Surface className="flex flex-col gap-5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold text-foreground">{meta.name}</p>
          <p className="text-xs text-muted-foreground">{meta.accounts}</p>
        </div>
        <StatusPill settings={settings} />
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">{meta.setup}</p>

      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-foreground">Redirect URI</p>
        <div className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5">
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground" title={redirectUri}>
            {redirectUri}
          </span>
          <CopyButton value={redirectUri} />
        </div>
      </div>

      <SsoProviderForm
        ref={formRef}
        provider={meta.provider}
        clientSecretSet={settings.clientSecretSet}
        lockForm={saving}
        initialValues={toFormData(settings)}
        onSubmit={handleSubmit}
      />
    </Surface>
  );
});

ProviderCard.displayName = 'ProviderCard';

const PROVIDER_TABS = PROVIDERS.map((meta) => ({id: meta.provider, label: meta.name}));

export type SsoSettingsTabHandle = {
  // Saves the provider in the active sub-tab.
  submit: () => void;
};

type SsoSettingsTabProps = {
  onSavingChange: (saving: boolean) => void;
};

// Settings → SSO: one sub-tab per sign-in provider. The page's Save saves
// the active provider only - they're independent configurations, one
// failing to save shouldn't block another. Every provider's card stays
// mounted (only the active one is shown) so unsaved edits in one survive a
// look at another.
const SsoSettingsTab = forwardRef<SsoSettingsTabHandle, SsoSettingsTabProps>(({onSavingChange}, ref) => {
  const {listSsoSettings} = useListSsoSettingsHook();
  // 'failed' still shows every form (empty) - loading the saved values is
  // what failed, not the page; each Save reports its own error anyway.
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [settingsByProvider, setSettingsByProvider] = useState<Partial<Record<SsoProvider, SsoProviderSettings>>>({});
  const [activeProvider, setActiveProvider] = useState<SsoProvider>(PROVIDERS[0].provider);
  const cardRefs = useRef<Partial<Record<SsoProvider, ProviderCardHandle | null>>>({});

  useImperativeHandle(ref, () => ({
    submit() {
      cardRefs.current[activeProvider]?.submit();
    },
  }));

  useEffect(() => {
    let cancelled = false;

    listSsoSettings().then((result) => {
      if (cancelled) {
        return;
      }

      if (!result.success) {
        setState('failed');
        return;
      }

      setSettingsByProvider(Object.fromEntries(result.providers.map((settings) => [settings.provider, settings])));
      setState('ready');
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listSsoSettings is a thin useRequestHook wrapper recreated every render
  }, []);

  if (state === 'loading') {
    return <p className="text-sm text-muted-foreground">Loading sign-in providers…</p>;
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      {state === 'failed' && (
        <Surface className="border-amber-400/30 bg-amber-400/5 px-4 py-3 text-sm text-amber-300">
          Couldn't load the saved sign-in settings, so the forms below start empty. Saving may fail too until the server supports SSO.
        </Surface>
      )}

      <Stepper
        steps={PROVIDER_TABS}
        activeId={activeProvider}
        onSelect={(id) => setActiveProvider(id as SsoProvider)}
        showNumbers={false}
      />

      {PROVIDERS.map((meta) => (
        <div key={meta.provider} hidden={meta.provider !== activeProvider}>
          <ProviderCard
            ref={(handle) => {
              cardRefs.current[meta.provider] = handle;
            }}
            meta={meta}
            onSavingChange={onSavingChange}
            settings={settingsByProvider[meta.provider] ?? emptySettings(meta.provider)}
            onSaved={(settings) => setSettingsByProvider((current) => ({...current, [meta.provider]: settings}))}
          />
        </div>
      ))}
    </div>
  );
});

SsoSettingsTab.displayName = 'SsoSettingsTab';

export default SsoSettingsTab;
