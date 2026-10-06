import type {CollectionResponse} from '@/lib/Request/Type/types';

// A personal access token of the logged-in user (Profile → Personal access
// tokens) - for MCP clients and scripts. The secret itself is never part of
// this shape: it's only in the create response (CreatedAccessToken), once.
// `resources` empty = the token carries all of the user's own permissions.
export type AccessToken = {
  id: string;
  name: string;
  tokenPrefix: string;
  resources: string[];
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  expired: boolean;
};

export type ListAccessTokensResponse = CollectionResponse<{id: string; resource: AccessToken}>;

export type ListAccessTokensResult =
  | {success: true; tokens: AccessToken[]}
  | {success: false};

// POST /api/user/me/access-tokens - expiresAt null = never expires,
// resources null = no narrowing (all of the user's permissions).
export type CreateAccessTokenPayload = {
  name: string;
  expiresAt: string | null;
  resources: string[] | null;
};

export type CreatedAccessToken = {
  id: string;
  name: string;
  token: string;
  tokenPrefix: string;
  resources: string[];
  createdAt: string;
  expiresAt: string | null;
};

export type CreateAccessTokenResponse = {
  id: string;
  type: string;
  resource: CreatedAccessToken;
};

export type CreateAccessTokenResult =
  | {success: true; token: CreatedAccessToken}
  | {success: false};

export type AccessTokenMutationResult =
  | {success: true}
  | {success: false};
