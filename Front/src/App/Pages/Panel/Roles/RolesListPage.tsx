import {useCallback, useEffect, useState} from 'react';
import {PageContainer} from '@/components/ui/page-container';
import {Link} from 'react-router-dom';
import {Plus, Trash2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useSetModuleTitle} from '../ModuleTitle';
import {useSetBreadcrumb} from '../Breadcrumb';
import useListRolesHook from '@/lib/Role/useListRolesHook';
import useDeleteRoleHook from '@/lib/Role/useDeleteRoleHook';
import type {RoleSummary} from '@/lib/Role/Type/types';

const RolesListPage = () => {
  const {listRoles} = useListRolesHook();
  const {deleteRole} = useDeleteRoleHook();
  const [roles, setRoles] = useState<RoleSummary[] | null>(null);
  // Which row is in the "click again to confirm" state - no dialog
  // component exists in this app, this is the lightest-weight equivalent.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useSetModuleTitle('Roles');
  // Not in the PrismMenu tree (reached via UserBadge's dropdown, not the
  // sidebar) - useBreadcrumb's default has nothing to walk for this route.
  useSetBreadcrumb([{label: 'Roles', link: null}]);

  const refetchRoles = useCallback(() => {
    listRoles().then((result) => {
      if (result.success) {
        setRoles(result.roles);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listRoles is a thin useRequestHook wrapper recreated every render
  }, []);

  useEffect(() => {
    refetchRoles();
  }, [refetchRoles]);

  const handleDeleteClick = (roleId: string) => {
    if (confirmingId !== roleId) {
      setConfirmingId(roleId);
      return;
    }

    setConfirmingId(null);
    setDeletingId(roleId);

    deleteRole(roleId)
      .then((result) => {
        if (result.success) {
          refetchRoles();
        }
      })
      .finally(() => setDeletingId(null));
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Roles</p>
        <Button asChild size="sm">
          <Link to="/roles/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add role
          </Link>
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-border bg-card p-5">
        {roles === null ? (
          <p className="text-sm text-muted-foreground">Loading roles…</p>
        ) : roles.length === 0 ? (
          <p className="text-sm text-muted-foreground">No roles yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {roles.map((role) => (
              <div
                key={role.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm text-foreground"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {role.name}
                    {role.isSystem && <span className="ml-2 text-xs text-muted-foreground">(system)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{role.resources.length} permission(s)</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/roles/${role.id}/edit`}>Edit</Link>
                  </Button>

                  <Button
                    variant={confirmingId === role.id ? 'destructive' : 'outline'}
                    size="sm"
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    disabled={role.isSystem}
                    loading={deletingId === role.id}
                    onClick={() => handleDeleteClick(role.id)}
                  >
                    {confirmingId === role.id ? 'Confirm delete?' : 'Delete'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default RolesListPage;
