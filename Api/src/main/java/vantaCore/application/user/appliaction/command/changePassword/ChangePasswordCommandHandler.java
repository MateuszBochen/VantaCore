package vantaCore.application.user.appliaction.command.changePassword;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;
import vantaCore.application.user.appliaction.dto.ChangePasswordRequest;
import vantaCore.application.user.domain.UserAggregate;
import vantaCore.application.user.domain.policy.ChangePasswordPolicy;
import vantaCore.application.user.domain.repository.UserAggregateRepositoryInterface;
import vantaCore.application.user.domain.vo.Password;

/** Existing JWTs stay valid after the change - tokens are stateless (see JwtService) and there's
 no revocation list, so this only affects future logins. */
@Component
final public class ChangePasswordCommandHandler implements CommandHandlerInterface<ChangePasswordCommand> {

    private final UserAggregateRepositoryInterface repository;
    private final CurrentUserProviderInterface currentUserProvider;
    private final ChangePasswordPolicy policy;

    public ChangePasswordCommandHandler(
        UserAggregateRepositoryInterface repository,
        CurrentUserProviderInterface currentUserProvider,
        ChangePasswordPolicy policy
    ) {
        this.repository = repository;
        this.currentUserProvider = currentUserProvider;
        this.policy = policy;
    }

    @Override
    public Void handle(ChangePasswordCommand command) {
        ChangePasswordRequest request = command.getChangePasswordRequest();
        UserAggregate user = this.repository.findById(this.currentUserProvider.getCurrentUserId());

        this.policy.check(new ChangePasswordPolicy.Check(user, request.getCurrentPassword(), request.getNewPassword())).assertAllowed();

        this.repository.save(user.withPassword(Password.fromRaw(request.getNewPassword())));

        return null;
    }
}
