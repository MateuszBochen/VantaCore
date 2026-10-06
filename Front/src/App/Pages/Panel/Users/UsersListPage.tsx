import {useEffect, useState} from 'react';
import {PageContainer} from '@/components/ui/page-container';
import {Link} from 'react-router-dom';
import {Plus} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Avatar} from '@/components/ui/avatar';
import {useSetModuleTitle} from '../ModuleTitle';
import {useSetBreadcrumb} from '../Breadcrumb';
import useListUsersHook from '@/lib/User/useListUsersHook';
import getUserDisplayName from '@/lib/User/getUserDisplayName';
import type {UserSummary} from '@/lib/User/Type/types';

const UsersListPage = () => {
  const {listUsers} = useListUsersHook();
  const [users, setUsers] = useState<UserSummary[] | null>(null);

  useSetModuleTitle('Users');
  // Not in the PrismMenu tree (reached via UserBadge's dropdown, not the
  // sidebar) - useBreadcrumb's default has nothing to walk for this route.
  useSetBreadcrumb([{label: 'Users', link: null}]);

  useEffect(() => {
    let cancelled = false;

    listUsers().then((result) => {
      if (!cancelled && result.success) {
        setUsers(result.users);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listUsers is a thin useRequestHook wrapper recreated every render
  }, []);

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Users</p>
        <Button asChild size="sm">
          <Link to="/users/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add user
          </Link>
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-border bg-card p-5">
        {users === null ? (
          <p className="text-sm text-muted-foreground">Loading users…</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm text-foreground"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={getUserDisplayName(user)} src={user.avatarUrl} className="h-8 w-8 text-sm" />
                  <div>
                    <p className="font-medium text-foreground">{getUserDisplayName(user)}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                <Button variant="outline" size="sm" asChild>
                  <Link to={`/users/${user.id}/edit`}>Edit</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default UsersListPage;
