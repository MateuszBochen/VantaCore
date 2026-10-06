import type {SaveRolePayload} from '@/lib/Role/Type/types';

const createDraftRole = (): SaveRolePayload => ({
  name: '',
  resources: [],
});

export default createDraftRole;
