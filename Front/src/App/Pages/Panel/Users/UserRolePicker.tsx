import {useEffect, useState} from 'react';
import {Checkbox} from '@/components/ui/checkbox';
import useListRolesHook from '@/lib/Role/useListRolesHook';
import type {RoleSummary} from '@/lib/Role/Type/types';

type UserRolePickerProps = {
  roleIds: string[];
  onChange: (roleIds: string[]) => void;
};

// Which roles a user has - same checkbox-list shape as BoardProjectsSection.
const UserRolePicker = ({roleIds, onChange}: UserRolePickerProps) => {
  const {listRoles} = useListRolesHook();
  const [roles, setRoles] = useState<RoleSummary[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    listRoles().then((result) => {
      if (!cancelled && result.success) {
        setRoles(result.roles);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listRoles is a thin useRequestHook wrapper recreated every render
  }, []);

  const toggle = (roleId: string, checked: boolean) => {
    onChange(checked ? [...roleIds, roleId] : roleIds.filter((id) => id !== roleId));
  };

  if (roles === null) {
    return <p className="text-sm text-muted-foreground">Loading roles…</p>;
  }

  if (roles.length === 0) {
    return <p className="text-sm text-muted-foreground">No roles exist yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">Pick which roles this user should have.</p>

      <div className="flex flex-col gap-1">
        {roles.map((role) => (
          <label
            key={role.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-sm text-foreground"
          >
            <Checkbox checked={roleIds.includes(role.id)} onCheckedChange={(checked) => toggle(role.id, checked)} />
            {role.name}
            {role.isSystem && <span className="text-xs text-muted-foreground">(system)</span>}
          </label>
        ))}
      </div>
    </div>
  );
};

export default UserRolePicker;
