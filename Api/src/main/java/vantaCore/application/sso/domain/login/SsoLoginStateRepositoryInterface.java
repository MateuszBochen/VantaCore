package vantaCore.application.sso.domain.login;

import java.time.Instant;
import java.util.Optional;

public interface SsoLoginStateRepositoryInterface {

    /** Also purges states that expired before `now`, so abandoned logins don't pile up. */
    void save(SsoLoginState state, Instant now);

    /** Atomically removes and returns the state - a second call with the same value (a replayed or
     double-submitted callback) always gets empty, even when both race. */
    Optional<SsoLoginState> consume(String state);
}
