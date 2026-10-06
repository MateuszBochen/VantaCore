import type {SsoProvider} from './Type/types';

// The callback URL to register in the provider's console (Entra ID app
// registration, Google OAuth client, GitHub OAuth app). It's a FRONT route,
// not the Api: the provider sends the browser back to
// /login/sso/{provider}, and that page hands the code to the Api in the
// background - so an end user never sees an Api address.
//
// Must match the Api's SsoRedirectUri exactly - {app.front-url}/login/sso/
// {lowercase provider}, no trailing slash. window.location.origin is the
// front the admin is configuring from, i.e. the same one users sign in on
// (app.front-url on the Api has to point at it too).
const buildSsoRedirectUri = (provider: SsoProvider): string => `${window.location.origin}/login/sso/${provider.toLowerCase()}`;

export default buildSsoRedirectUri;
