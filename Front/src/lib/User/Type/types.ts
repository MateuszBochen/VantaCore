import type {CollectionResponse} from '@/lib/Request/Type/types';

// The app-wide user directory entry - matches GET /api/user's (list) resource
// shape exactly (name/lastName come back as separate fields, not a combined
// display name - see getUserDisplayName for that). Note GET /api/user/
// {userId} (single, see UserDetail below) uses `firstName` instead of
// `name` - a real inconsistency in the API, not a typo here.
export type UserSummary = {
  id: string;
  name: string;
  lastName: string;
  email: string;
  avatarUrl: string;
};

export type ListUsersResponseItem = {
  id: string;
  resource: UserSummary;
};

export type ListUsersResponse = CollectionResponse<ListUsersResponseItem>;

export type ListUsersResult =
  | {success: true; users: UserSummary[]}
  | {success: false};

// POST /api/user - roleIds are assigned at creation time; PUT
// /api/user/{userId}/roles (useAssignUserRolesHook) is the separate path
// for changing an existing user's roles afterwards.
export type CreateUserPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleIds: string[];
};

// Same 422 shape as CreateAdminErrorResponse.
export type CreateUserErrorItem = {
  id: string;
  resource: {
    code: string;
    message: string;
    isBlocked: boolean;
  };
};

export type CreateUserErrorResponse = CollectionResponse<CreateUserErrorItem>;

export type CreateUserResult =
  | {success: true}
  | {success: false; errors: CreateUserErrorItem[]};

export type AssignUserRolesResult =
  | {success: true}
  | {success: false};

// GET /api/user/{userId} - the single-user detail view, used by
// UserFormPage's edit mode. Unlike UserSummary, roles come back as full
// objects (not just ids) since there's no separate role-lookup needed to
// render them.
export type UserRoleSummary = {
  id: string;
  name: string;
  isSystem: boolean;
};

export type UserDetail = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string;
  roles: UserRoleSummary[];
};

export type GetUserResponse = {
  id: string;
  type: string;
  resource: UserDetail;
};

export type GetUserResult =
  | {success: true; user: UserDetail}
  | {success: false};

// PUT /api/user/{userId} - basics only (no password, no roles - those go
// through useAssignUserRolesHook separately).
export type UpdateUserPayload = {
  email: string;
  firstName: string;
  lastName: string;
};

export type UpdateUserResult =
  | {success: true}
  | {success: false};
// PUT /api/user/me/password - the logged-in user changing their own
// password (identity comes from the JWT, no userId in the path). An admin
// resetting someone else's password is a separate concern, not this.
export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

// Same 422 envelope as CreateUserErrorItem - resource.code is
// `<prefix>.<field>` (e.g. `validation.currentPassword`) for a field error.
// errors is empty for a non-422 failure (already toasted by the hook).
export type ChangePasswordResult =
  | {success: true}
  | {success: false; errors: CreateUserErrorItem[]};
