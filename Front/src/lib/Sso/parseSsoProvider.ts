import type {SsoProvider} from './Type/types';

const PROVIDERS: SsoProvider[] = ['MICROSOFT', 'GOOGLE', 'GITHUB', 'OIDC'];

// "google" (the /login/sso/:provider route segment) -> 'GOOGLE'; null for
// anything that isn't one of ours.
const parseSsoProvider = (value: string | undefined): SsoProvider | null => {
  const upper = (value ?? '').toUpperCase();
  return PROVIDERS.find((provider) => provider === upper) ?? null;
};

export default parseSsoProvider;
