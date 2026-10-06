import {useEffect, useState} from 'react';
import useListUsersHook from './useListUsersHook';
import {usersCache} from './UsersCache';
import type {UserSummary} from './Type/types';

// Loads the user directory once per session (see UsersCache) - every field
// that needs it (e.g. the "user" custom field type) calls this instead of
// listing users itself, so opening a second ticket/field never re-fetches.
const useUsersHook = () => {
  const [users, setUsers] = useState<UserSummary[] | null>(usersCache.get());
  const {listUsers} = useListUsersHook();

  useEffect(() => {
    if (usersCache.get()) {
      return;
    }

    let cancelled = false;
    let pending = usersCache.getPending();

    if (!pending) {
      pending = listUsers().then((result) => {
        const loaded = result.success ? result.users : [];
        usersCache.set(loaded);
        usersCache.setPending(null);
        return loaded;
      });
      usersCache.setPending(pending);
    }

    pending.then((loaded) => {
      if (!cancelled) {
        setUsers(loaded);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listUsers is a thin useRequestHook wrapper recreated every render; the usersCache.get() guard above prevents refetching once loaded
  }, []);

  return {users: users ?? []};
};

export default useUsersHook;