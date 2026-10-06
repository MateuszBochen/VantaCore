import type {InterfaceJwtValue} from './Type/types';

class JwtManager {
    static JWT_TOKEN = 'jwtToken';

    static JWT_EMAIL = 'jwtEmail';

    private static instance: JwtManager;

    private jwtValue: InterfaceJwtValue;

    static getInstance = (): JwtManager => {
        if (!JwtManager.instance) {
            JwtManager.instance = new JwtManager();
        }

        return JwtManager.instance;
    }

    private constructor() {
        const jwtToken = this.getJwt();
        if(jwtToken) {
            this.jwtValue = JwtManager.parse(jwtToken);
        } else {
            this.jwtValue = {
                exp: 0,
                username: '',
            }
        }

        // localStorage is shared across every tab on this origin, but
        // `jwtValue` is this tab's own in-memory copy - the `storage` event
        // only fires in *other* tabs when one of them changes it (never in
        // the tab that made the change), which is exactly what's needed
        // here to keep every tab's copy in sync with whichever tab last
        // logged in, refreshed, or logged out. Without this, two open tabs
        // each running their own JwtRefreshScheduler would race: one
        // refreshes and rotates the token, the other's stale in-memory exp
        // still thinks its (now superseded) token needs refreshing too, and
        // that redundant attempt can fail and log both tabs out.
        window.addEventListener('storage', (event) => {
            if (event.key !== JwtManager.JWT_TOKEN) {
                return;
            }

            this.jwtValue = event.newValue ? JwtManager.parse(event.newValue) : {exp: 0, username: ''};
        });
    }

    getUserName = () => {
        return this.jwtValue.username;
    }

    jwtIsValid = () => {
        const timestamp = this.getCurrentTimestamp();
        if (timestamp > this.jwtValue.exp) {
            localStorage.removeItem(JwtManager.JWT_TOKEN);
            return false;
        }

        return true;
    }

    getSecondsToExpire = (): number => {
        const timestamp = this.getCurrentTimestamp();
        return this.jwtValue.exp - timestamp;
    }

    setJwt = (jwtToken: string) => {
        localStorage.setItem(JwtManager.JWT_TOKEN, jwtToken);

        this.jwtValue = JwtManager.parse(jwtToken);
    }

    getJwt = (): string =>  {
       return localStorage.getItem(JwtManager.JWT_TOKEN) || '';
    }

    setEmail = (email: string): void => {
        localStorage.setItem(JwtManager.JWT_EMAIL, email);
    }

    getEmail = (): string => {
        return localStorage.getItem(JwtManager.JWT_EMAIL) || '';
    }

    private getCurrentTimestamp = () => {
        return new Date().getTime() / 1000;
    }

    removeJwt = ()=>  {
        localStorage.removeItem(JwtManager.JWT_TOKEN);
        localStorage.removeItem(JwtManager.JWT_EMAIL);

        // Without this, jwtIsValid() keeps trusting the stale in-memory exp
        // from the last setJwt() while getJwt() already reads '' from the
        // now-cleared localStorage - that mismatch is what let requests go
        // out with an empty "Bearer " header after JwtRefreshScheduler's
        // background refresh failed and called this.
        this.jwtValue = {
            exp: 0,
            username: '',
        };
    }

    private static parse = (token: string): InterfaceJwtValue => {
        if (!token) {
            return {
                exp: 0,
                username: '',
            };
        }

        const base64Url = token.split('.')[1];

        if (!base64Url) {
            return {
                exp: 0,
                username: '',
            };
        }

        const base64 = base64Url.replace('-', '+').replace('_', '/');
        return JSON.parse(window.atob(base64));
    }
}

export default JwtManager;

