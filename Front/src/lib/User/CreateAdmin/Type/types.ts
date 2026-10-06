import type {CollectionResponse} from '@/lib/Request/Type/types';

export type CreateAdminRequestData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export type CreateAdminErrorItem = {
  id: string;
  resource: {
    code: string;
    message: string;
    isBlocked: boolean;
  };
};

export type CreateAdminErrorResponse = CollectionResponse<CreateAdminErrorItem>;

export type CreateAdminResult =
  | {success: true}
  | {success: false; errors: CreateAdminErrorItem[]};