import JwtManager from './JwtManager';
import useRefreshTokenHook from './Refresh/useRefreshTokenHook';
import {eventBus} from '../EventBus/EventBus';
import {UserLoggedOutEvent} from '../Auth/Event/UserLoggedOutEvent';

const CHECK_INTERVAL_MS = 30_000;
const REFRESH_MARGIN_SECONDS = 60;

// Cross-tab lock: localStorage is shared, but each tab runs its own
// scheduler on its own 30s interval, so two tabs can both decide "this
// token needs refreshing" around the same moment. Without a lock both fire
// a refresh request; even though JwtManager now keeps every tab's in-memory
// token in sync via the `storage` event, the *requests themselves* still
// race, and if the backend's refresh is single-use (rotates/invalidates
// the previous token) the second tab's call fails and logs everyone out.
// A short-lived timestamp lock lets whichever tab gets there first do the
// refresh; the rest just pick up the new token via the storage event on
// their next tick instead of also attempting it.
const REFRESH_LOCK_KEY = 'jwtRefreshLock';
const REFRESH_LOCK_TTL_MS = 10_000;

class JwtRefreshScheduler {
    private static instance: JwtRefreshScheduler;

    private timer: ReturnType<typeof setInterval> | null = null;

    private refreshing = false;

    static getInstance = (): JwtRefreshScheduler => {
        if (!JwtRefreshScheduler.instance) {
            JwtRefreshScheduler.instance = new JwtRefreshScheduler();
        }

        return JwtRefreshScheduler.instance;
    }

    private constructor() {
    }

    start = (): void => {
        if (this.timer) {
            return;
        }

        this.timer = setInterval(this.tick, CHECK_INTERVAL_MS);
    }

    stop = (): void => {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    private tick = async (): Promise<void> => {
        const jwtManager = JwtManager.getInstance();

        if (this.refreshing) {
            return;
        }

        if (!jwtManager.jwtIsValid()) {
            eventBus.dispatch(new UserLoggedOutEvent());
            return;
        }

        if (jwtManager.getSecondsToExpire() > REFRESH_MARGIN_SECONDS) {
            return;
        }

        if (!this.acquireRefreshLock()) {
            // Another tab is already refreshing (or just did) - its result
            // reaches this tab via JwtManager's `storage` listener, no need
            // to also attempt it here.
            return;
        }

        this.refreshing = true;

        try {
            // eslint-disable-next-line react-hooks/rules-of-hooks -- useRefreshTokenHook is a plain factory (like useRequestHook), not a real React hook, safe to call outside components
            const {refreshToken} = useRefreshTokenHook();
            const token = await refreshToken();

            jwtManager.setJwt(token);
        } catch (error) {
            console.error('Failed to refresh jwt token', error);
            jwtManager.removeJwt();
            eventBus.dispatch(new UserLoggedOutEvent());
        } finally {
            this.releaseRefreshLock();
            this.refreshing = false;
        }
    }

    // Not a perfect distributed mutex (the check-then-write isn't atomic
    // across tabs), just a best-effort narrowing of the race window - see
    // the comment above REFRESH_LOCK_KEY for why that's good enough here.
    private acquireRefreshLock = (): boolean => {
        const existing = Number(localStorage.getItem(REFRESH_LOCK_KEY));

        if (existing && Date.now() - existing < REFRESH_LOCK_TTL_MS) {
            return false;
        }

        localStorage.setItem(REFRESH_LOCK_KEY, String(Date.now()));
        return true;
    }

    private releaseRefreshLock = (): void => {
        localStorage.removeItem(REFRESH_LOCK_KEY);
    }
}

export default JwtRefreshScheduler;

export const jwtRefreshScheduler = JwtRefreshScheduler.getInstance();