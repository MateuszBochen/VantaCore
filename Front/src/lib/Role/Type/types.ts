import type {CollectionResponse} from '@/lib/Request/Type/types';

// A role is a named bundle of permission codes (e.g. "ROLE_CREATE"),
// assignable to any user via useAssignUserRolesHook. `isSystem` roles are
// backend-seeded - RolesListPage disables Delete for them (still editable,
// since nothing in the API spec says otherwise).
export type RoleSummary = {
  id: string;
  name: string;
  isSystem: boolean;
  resources: string[];
};

export type ListRolesResponseItem = {
  id: string;
  resource: RoleSummary;
};

export type ListRolesResponse = CollectionResponse<ListRolesResponseItem>;

export type ListRolesResult =
  | {success: true; roles: RoleSummary[]}
  | {success: false};

// A single assignable permission - `code` is what goes into a role's
// `resources` array (e.g. "ROLE_CREATE"), `name` is the human label shown
// in RoleResourcesSection's checkbox list.
export type RoleResourceSummary = {
  name: string;
  code: string;
};

export type ListRoleResourcesResponseItem = {
  id: string;
  resource: RoleResourceSummary;
};

export type ListRoleResourcesResponse = CollectionResponse<ListRoleResourcesResponseItem>;

export type ListRoleResourcesResult =
  | {success: true; resources: RoleResourceSummary[]}
  | {success: false};

export type SaveRolePayload = {
  name: string;
  resources: string[];
};

export type SaveRoleResult =
  | {success: true}
  | {success: false};

export type DeleteRoleResult =
  | {success: true}
  | {success: false};
