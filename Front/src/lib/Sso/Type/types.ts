import type {CollectionResponse} from '../../Request/Type/types';

// Sign-in providers configurable under Settings → SSO. Microsoft (Entra ID)
// and Google are OpenID Connect; GitHub is plain OAuth2; OIDC is any other
// OpenID Connect provider (Okta, Keycloak, Auth0, ...) configured by its
// issuer URL. The lowercase form is what goes into URLs (see
// buildSsoRedirectUri).
export type SsoProvider = 'MICROSOFT' | 'GOOGLE' | 'GITHUB' | 'OIDC';

// One provider's configuration as GET /api/settings/sso returns it. The
// client secret is write-only: the Api never sends it back, only whether
// one is stored (clientSecretSet), same idea as a VCS webhook secret.
export type SsoProviderSettings = {
  provider: SsoProvider;
  enabled: boolean;
  clientId: string;
  clientSecretSet: boolean;
  // Microsoft only - a directory (tenant) id, or 'organizations' to accept
  // any work/school account. null for the others.
  tenantId: string | null;
  // OIDC only - the provider's issuer URL (its /.well-known/openid-
  // configuration lives under it) and the name shown on its sign-in button.
  // null for the others.
  issuerUrl: string | null;
  displayName: string | null;
};

// PUT /api/settings/sso/{provider}. clientSecret null = keep the stored one
// (the form leaves the secret field empty unless it's being replaced).
export type SaveSsoProviderPayload = {
  enabled: boolean;
  clientId: string;
  clientSecret: string | null;
  tenantId: string | null;
  issuerUrl: string | null;
  displayName: string | null;
};

export type ListSsoSettingsResponse = CollectionResponse<{id: string; resource: SsoProviderSettings}>;

export type ListSsoSettingsResult =
  | {success: true; providers: SsoProviderSettings[]}
  | {success: false};

export type SaveSsoProviderResult =
  | {success: true}
  | {success: false; message: string};
