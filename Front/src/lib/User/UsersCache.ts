import type {UserSummary} from './Type/types';

// Unlike ProjectCache/TicketCache (cache one entity per id), this caches the
// single "list everyone" result once for the whole session - every consumer
// of the user directory (assignee/custom-field pickers, ...) shares it
// instead of each mount re-fetching /api/user.
class UsersCache {
    private static instance: UsersCache;

    private users: UserSummary[] | null = null;

    private pending: Promise<UserSummary[]> | null = null;

    static getInstance = (): UsersCache => {
        if (!UsersCache.instance) {
            UsersCache.instance = new UsersCache();
        }

        return UsersCache.instance;
    }

    private constructor() {
    }

    get = (): UserSummary[] | null => {
        return this.users;
    }

    set = (users: UserSummary[]): void => {
        this.users = users;
    }

    getPending = (): Promise<UserSummary[]> | null => {
        return this.pending;
    }

    setPending = (pending: Promise<UserSummary[]> | null): void => {
        this.pending = pending;
    }
}

export default UsersCache;

export const usersCache = UsersCache.getInstance();