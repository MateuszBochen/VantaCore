import {useEffect, useState} from 'react';
import {Checkbox} from '@/components/ui/checkbox';
import useListRoleResourcesHook from '@/lib/Role/useListRoleResourcesHook';
import type {RoleResourceSummary} from '@/lib/Role/Type/types';

type RoleResourcesSectionProps = {
  resources: string[];
  onChange: (resources: string[]) => void;
};

// Which permission codes this role grants - same checkbox-list shape as
// BoardProjectsSection, keyed by permission `code` (e.g. "ROLE_CREATE")
// instead of an id.
const RoleResourcesSection = ({resources, onChange}: RoleResourcesSectionProps) => {
  const {listRoleResources} = useListRoleResourcesHook();
  const [available, setAvailable] = useState<RoleResourceSummary[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    listRoleResources().then((result) => {
      if (!cancelled && result.success) {
        setAvailable(result.resources);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listRoleResources is a thin useRequestHook wrapper recreated every render
  }, []);

  const toggle = (code: string, checked: boolean) => {
    onChange(checked ? [...resources, code] : resources.filter((existing) => existing !== code));
  };

  if (available === null) {
    return <p className="text-sm text-muted-foreground">Loading permissions…</p>;
  }

  if (available.length === 0) {
    return <p className="text-sm text-muted-foreground">No permissions exist yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">Pick which permissions this role grants.</p>

      <div className="flex flex-col gap-1">
        {available.map((resource) => (
          <label
            key={resource.code}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-sm text-foreground"
          >
            <Checkbox checked={resources.includes(resource.code)} onCheckedChange={(checked) => toggle(resource.code, checked)} />
            {resource.name}
            <span className="text-xs text-muted-foreground">{resource.code}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default RoleResourcesSection;
