import type {SsoProvider} from '../../Sso/Type/types';

// Per-provider extras the login page needs. Today only an enabled OIDC
// provider has any (its button label) - the other providers are fully
// described by their name, so theirs is null.
export type SsoProviderPublicSettings = {
  displayName: string;
};

// One sign-in provider as the public, unauthenticated
// GET /web-api/open-settings reports it - always all four, in a fixed
// order; unconfigured ones are enabled: false. Deliberately no clientId/
// tenantId/issuerUrl/secret (it's public).
export type SsoProviderAvailability = {
  provider: SsoProvider;
  enabled: boolean;
  settings: SsoProviderPublicSettings | null;
};

// App settings safe to expose before sign-in (grows as more are needed).
export type OpenSettings = {
  sso: SsoProviderAvailability[];
};

export type GetOpenSettingsResponse = {
  id: string;
  type: string;
  resource: OpenSettings;
};

export type GetOpenSettingsResult =
  | {success: true; settings: OpenSettings}
  | {success: false};
