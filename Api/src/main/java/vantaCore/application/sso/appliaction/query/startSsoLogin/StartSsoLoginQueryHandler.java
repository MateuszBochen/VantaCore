package vantaCore.application.sso.appliaction.query.startSsoLogin;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.sso.appliaction.service.SsoLoginSupport;
import vantaCore.application.sso.appliaction.service.SsoProviderClientRegistry;
import vantaCore.application.sso.domain.SsoProviderConfigAggregate;
import vantaCore.application.sso.domain.login.SsoAuthorizationRequest;
import vantaCore.application.sso.domain.login.SsoLoginState;
import vantaCore.application.sso.domain.login.SsoLoginStateRepositoryInterface;
import vantaCore.application.sso.domain.login.SsoProviderException;
import vantaCore.application.sso.domain.login.SsoRedirectUri;

import java.time.Instant;
import java.util.Locale;

/** Step 1 of SSO login: validates the provider and the front's redirect route, remembers a fresh
 one-time state (+ PKCE verifier + nonce) for ~10 minutes and returns the provider URL the browser
 should go to. The provider will send the browser back to redirectUri - a FRONT route, never the
 API - with ?code&state, which the front then POSTs to .../callback. */
@Component
final public class StartSsoLoginQueryHandler implements QueryHandlerInterface<StartSsoLoginQuery, Item<SsoAuthorizationResult>> {

    private static final Logger log = LoggerFactory.getLogger(StartSsoLoginQueryHandler.class);

    private final SsoLoginSupport support;
    private final SsoProviderClientRegistry clients;
    private final SsoLoginStateRepositoryInterface stateRepository;
    private final String frontUrl;

    public StartSsoLoginQueryHandler(
        SsoLoginSupport support,
        SsoProviderClientRegistry clients,
        SsoLoginStateRepositoryInterface stateRepository,
        @Value("${app.front-url}") String frontUrl
    ) {
        this.support = support;
        this.clients = clients;
        this.stateRepository = stateRepository;
        this.frontUrl = frontUrl;
    }

    @Override
    public Item<SsoAuthorizationResult> handle(StartSsoLoginQuery query) {
        if (!SsoRedirectUri.isAllowed(this.frontUrl, query.getProvider(), query.getRedirectUri())) {
            throw SsoLoginSupport.error("sso-invalid-redirect-uri", "This redirect address is not allowed");
        }

        SsoProviderConfigAggregate config = this.support.usableConfig(query.getProvider());

        Instant now = Instant.now();
        SsoLoginState state = new SsoLoginState(
            SsoLoginSupport.randomToken(),
            query.getProvider(),
            query.getRedirectUri(),
            SsoLoginSupport.randomToken(),
            SsoLoginSupport.randomToken(),
            now.plus(SsoLoginState.TIME_TO_LIVE)
        );

        String authorizationUrl;
        try {
            authorizationUrl = this.clients.get(query.getProvider()).authorizationUrl(new SsoAuthorizationRequest(
                config, state.redirectUri(), state.state(), SsoLoginSupport.codeChallenge(state.codeVerifier()), state.nonce()
            ));
        } catch (SsoProviderException exception) {
            log.warn("SSO authorize for {} failed: {}", query.getProvider(), exception.getMessage());
            throw SsoLoginSupport.error("sso-provider-error", "The sign-in provider could not be reached");
        }

        this.stateRepository.save(state, now);

        return Item.fromPayload(query.getProvider().name().toLowerCase(Locale.ROOT), new SsoAuthorizationResult(authorizationUrl));
    }
}
