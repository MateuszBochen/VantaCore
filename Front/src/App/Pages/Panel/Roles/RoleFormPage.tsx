import {useCallback, useEffect, useState} from 'react';
import {Check} from 'lucide-react';
import {PageContainer} from '@/components/ui/page-container';
import {useNavigate, useParams} from 'react-router-dom';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {useSetModuleTitle} from '../ModuleTitle';
import {useSetBreadcrumb} from '../Breadcrumb';
import useSaveRoleHook from '@/lib/Role/useSaveRoleHook';
import useListRolesHook from '@/lib/Role/useListRolesHook';
import createDraftRole from './createDraftRole';
import RoleResourcesSection from './RoleResourcesSection';
import type {SaveRolePayload} from '@/lib/Role/Type/types';

// Handles both .../roles/new (create) and .../roles/:roleId/edit (edit).
// There's no GET-single-role endpoint, so edit mode fetches the role list
// and filters client-side - same convention as SprintFormPage's edit mode
// (unlike UserFormPage, which has a real GET-single-user endpoint to use
// instead).
type FetchState = {
  id: string;
  role: SaveRolePayload | null;
};

const RoleFormPage = () => {
  const {roleId} = useParams<{roleId?: string}>();
  const isEdit = Boolean(roleId);
  const navigate = useNavigate();
  const {listRoles} = useListRolesHook();
  const {saveRole} = useSaveRoleHook();
  const [fetched, setFetched] = useState<FetchState | null>(null);
  const [draft, setDraft] = useState<SaveRolePayload | null>(null);
  const [draftForId, setDraftForId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useSetModuleTitle(isEdit ? 'Edit role' : 'New role');
  // Not in the PrismMenu tree (reached via UserBadge's dropdown, not the
  // sidebar) - useBreadcrumb's default has nothing to walk for this route.
  useSetBreadcrumb([{label: 'Roles', link: '/roles'}, {label: isEdit ? 'Edit role' : 'New role', link: null}]);

  useEffect(() => {
    if (!isEdit || !roleId) {
      return;
    }

    let cancelled = false;

    listRoles().then((result) => {
      if (!cancelled) {
        const role = result.success ? (result.roles.find((candidate) => candidate.id === roleId) ?? null) : null;
        setFetched({id: roleId, role: role ? {name: role.name, resources: role.resources} : null});
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listRoles is a thin useRequestHook wrapper recreated every render
  }, [isEdit, roleId]);

  // Derived-during-render reset (not an effect) - same pattern as
  // BoardSettingsPage/SprintFormPage.
  if (!isEdit && draftForId !== 'new') {
    setDraftForId('new');
    setDraft(createDraftRole());
  }

  if (isEdit && fetched?.role && fetched.id !== draftForId) {
    setDraftForId(fetched.id);
    setDraft(fetched.role);
  }

  const handleSubmit = useCallback(() => {
    if (!draft) {
      return;
    }

    setSaving(true);

    saveRole(draft, {isNew: !isEdit, roleId})
      .then((result) => {
        if (result.success) {
          navigate('/roles', {replace: true});
        }
      })
      .finally(() => setSaving(false));
  }, [draft, isEdit, roleId, saveRole, navigate]);

  if (isEdit && fetched?.id === roleId && !fetched?.role) {
    return <p className="p-8 text-sm text-muted-foreground">Role not found.</p>;
  }

  if (!draft) {
    return <p className="p-8 text-sm text-muted-foreground">{isEdit ? 'Loading role…' : 'Loading…'}</p>;
  }

  return (
    <PageContainer>
      <p className="text-sm font-semibold text-foreground">{isEdit ? 'Edit role' : 'New role'}</p>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
        <div className="flex max-w-md flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Role name</label>
          <Input
            value={draft.name}
            onChange={(e) => setDraft({...draft, name: e.target.value})}
            placeholder="e.g. Project Manager"
          />
        </div>

        <RoleResourcesSection resources={draft.resources} onChange={(resources) => setDraft({...draft, resources})} />
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <Button leftIcon={<Check className="h-4 w-4" />} onClick={handleSubmit} loading={saving} disabled={!draft.name.trim()}>
          Submit
        </Button>
      </div>
    </PageContainer>
  );
};

export default RoleFormPage;
