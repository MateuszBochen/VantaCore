export type RefreshTokenResult = {
  token: string;
};

export type RefreshTokenResponse = {
  id: string;
  type: string;
  resource: RefreshTokenResult;
};