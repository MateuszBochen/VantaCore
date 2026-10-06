import type {CollectionResponse} from '@/lib/Request/Type/types';

export type LoginRequestData = {
  email: string;
  password: string;
};

export type LoginResultData = {
  token: string;
  email: string;
};

export type LoginResponse = {
  id: string;
  type: string;
  resource: LoginResultData;
};

export type LoginErrorItem = {
  id: string;
  resource: {
    code: string;
    message: string;
    isBlocked: boolean;
  };
};

export type LoginErrorResponse = CollectionResponse<LoginErrorItem>;

export type LoginResult =
  | {success: true}
  | {success: false; errors: LoginErrorItem[]};