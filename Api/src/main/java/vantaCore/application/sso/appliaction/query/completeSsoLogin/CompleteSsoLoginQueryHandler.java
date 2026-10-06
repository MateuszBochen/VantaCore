package vantaCore.application.sso.appliaction.query.completeSsoLogin;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import vantaCore.application.role.appliaction.service.EffectiveResourceResolver;
import vantaCore.application.security.jwt.JwtService;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.sso.appliaction.dto.SsoCallbackRequest;
import vantaCore.application.sso.appliaction.service.SsoLoginSupport;
import vantaCore.application.sso.appliaction.service.SsoProviderClientRegistry;
import vantaCore.application.sso.domain.SsoProviderConfigAggregate;
import vantaCore.application.sso.domain.login.SsoCodeExchange;
import vantaCore.application.sso.domain.login.SsoIdentity;
import vantaCore.application.sso.domain.login.SsoLoginState;
import vantaCore.application.sso.domain.login.SsoLoginStateRepositoryInterface;
import vantaCore.application.sso.domain.login.SsoProviderException;
import vantaCore.application.sso.domain.policy.SsoIdentityPolicy;
import vantaCore.application.user.appliaction.query.login.LoginResult;
import vantaCore.application.user.domain.UserAggregate;
import vantaCore.application.user.domain.repository.UserAggregateRepositoryInterface;
import vantaCore.application.user.domain.vo.Email;

import java.time.Instant;
import java.util.Set;

/** Step 2 of SSO login: consumes the one-time state (whatever happens next, it can't be replayed),
 redeems the code with the provider, and logs in the EXISTING VantaCore account with that email -
 no accounts are created here. Returns exactly LoginQueryHandler's LoginResult, so the front stores
 the token the same way as after a password login. Reads the user/role modules directly - a
 read-only cross-module lookup the response itself depends on (see CLAUDE.md). */
@Component
final public class CompleteSsoLoginQueryHandler implements QueryHandlerInterface<CompleteSsoLoginQuery, Item<LoginResult>> {

    private static final Logger log = LoggerFactory.getLogger(CompleteSsoLoginQueryHandler.class);

    private final SsoLoginSupport support;
    private final SsoProviderClientRegistry clients;
    private final SsoLoginStateRepositoryInterface stateRepository;
    private final SsoIdentityPolicy identityPolicy;
    private final UserAggregateRepositoryInterface userRepository;
    private final EffectiveResourceResolver effectiveResourceResolver;
    private final JwtService jwtService;

    public CompleteSsoLoginQueryHandler(
        SsoLoginSupport support,
        SsoProviderClientRegistry clients,
        SsoLoginStateRepositoryInterface stateRepository,
        SsoIdentityPolicy identityPolicy,
        UserAggregateRepositoryInterface userRepository,
        EffectiveResourceResolver effectiveResourceResolver,
        JwtService jwtService
    ) {
        this.support = support;
        this.clients = clients;
        this.stateRepository = stateRepository;
        this.identityPolicy = identityPolicy;
        this.userRepository = userRepository;
        this.effectiveResourceResolver = effectiveResourceResolver;
        this.jwtService = jwtService;
    }

    @Override
    public Item<LoginResult> handle(CompleteSsoLoginQuery query) {
        SsoCallbackRequest request = query.getSsoCallbackRequest();

        // Consumed before anything else can fail, so even a rejected attempt burns the state.
        SsoLoginState state = this.stateRepository.consume(request.getState())
            .filter(candidate -> candidate.isValidFor(query.getProvider(), request.getRedirectUri(), Instant.now()))
            .orElseThrow(() -> SsoLoginSupport.error("sso-invalid-state", "This sign-in attempt has expired - please try again"));

        SsoProviderConfigAggregate config = this.support.usableConfig(query.getProvider());

        SsoIdentity identity;
        try {
            identity = this.clients.get(query.getProvider()).exchangeCode(new SsoCodeExchange(
                config, request.getCode(), state.redirectUri(), state.codeVerifier(), state.nonce()
            ));
        } catch (SsoProviderException exception) {
            log.warn("SSO callback for {} failed: {}", query.getProvider(), exception.getMessage());
            throw SsoLoginSupport.error("sso-provider-error", "The sign-in provider did not confirm your identity");
        }

        this.identityPolicy.check(new SsoIdentityPolicy.Check(query.getProvider(), identity.emailVerified())).assertAllowed();

        UserAggregate user = this.userRepository.findByEmailIgnoreCase(new Email(identity.email()))
            .orElseThrow(() -> SsoLoginSupport.error("sso-user-not-found", "No VantaCore account exists for " + identity.email()));

        Set<String> resourceCodes = this.effectiveResourceResolver.resolve(user.getRoleIds());
        String token = this.jwtService.generateToken(user.getId(), resourceCodes);
        String email = user.getCredentials().email().value();

        return Item.fromPayload(email, new LoginResult(token, email));
    }
}
