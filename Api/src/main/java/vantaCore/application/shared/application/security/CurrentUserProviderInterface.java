package vantaCore.application.shared.application.security;

import vantaCore.application.user.domain.vo.UserId;

public interface CurrentUserProviderInterface {

    /** id of the authenticated user making the current request */
    UserId getCurrentUserId();

    /** True when the current request authenticated with a personal access token rather than a
     login session (JWT) - for the few things a token must not do itself, e.g. mint more tokens. */
    boolean isAccessTokenSession();
}
