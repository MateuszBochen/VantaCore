package vantaCore.application.user.appliaction.query.login;

import org.springframework.stereotype.Component;
import vantaCore.application.role.appliaction.service.EffectiveResourceResolver;
import vantaCore.application.security.jwt.JwtService;
import vantaCore.application.shared.application.exception.AuthenticationFailedException;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.user.appliaction.dto.LoginRequest;
import vantaCore.application.user.domain.UserAggregate;
import vantaCore.application.user.domain.repository.UserAggregateRepositoryInterface;
import vantaCore.application.user.domain.vo.Email;

import java.util.Set;

@Component
final public class LoginQueryHandler implements QueryHandlerInterface<LoginQuery, Item<LoginResult>> {

    private final UserAggregateRepositoryInterface repository;
    private final JwtService jwtService;
    private final EffectiveResourceResolver effectiveResourceResolver;

    public LoginQueryHandler(
        UserAggregateRepositoryInterface repository,
        JwtService jwtService,
        EffectiveResourceResolver effectiveResourceResolver
    ) {
        this.repository = repository;
        this.jwtService = jwtService;
        this.effectiveResourceResolver = effectiveResourceResolver;
    }

    @Override
    public Item<LoginResult> handle(LoginQuery query) {
        LoginRequest loginRequest = query.getLoginRequest();
        Email email = new Email(loginRequest.getEmail());

        UserAggregate user = repository.findByEmail(email)
            .filter(candidate -> candidate.getCredentials().password().isSame(loginRequest.getPassword()))
            .orElseThrow(AuthenticationFailedException::new);

        Set<String> resourceCodes = this.effectiveResourceResolver.resolve(user.getRoleIds());
        String token = jwtService.generateToken(user.getId(), resourceCodes);

        return Item.fromPayload(email.value(), new LoginResult(token, email.value()));
    }
}