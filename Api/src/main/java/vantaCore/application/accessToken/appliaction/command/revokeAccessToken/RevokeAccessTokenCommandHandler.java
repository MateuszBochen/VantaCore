package vantaCore.application.accessToken.appliaction.command.revokeAccessToken;

import org.springframework.stereotype.Component;
import vantaCore.application.accessToken.domain.repository.PersonalAccessTokenRepositoryInterface;
import vantaCore.application.accessToken.domain.vo.AccessTokenId;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.exception.AccessTokenNotFoundException;
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;

import java.util.UUID;

/** Deleted outright - a revoked token has nothing left worth keeping. Someone else's token id
 reads as not-found, never as forbidden, so token ids can't be probed. */
@Component
final public class RevokeAccessTokenCommandHandler implements CommandHandlerInterface<RevokeAccessTokenCommand> {

    private final PersonalAccessTokenRepositoryInterface repository;
    private final CurrentUserProviderInterface currentUserProvider;

    public RevokeAccessTokenCommandHandler(PersonalAccessTokenRepositoryInterface repository, CurrentUserProviderInterface currentUserProvider) {
        this.repository = repository;
        this.currentUserProvider = currentUserProvider;
    }

    @Override
    public Void handle(RevokeAccessTokenCommand command) {
        AccessTokenId id = new AccessTokenId(command.getTokenId());
        UUID currentUserId = this.currentUserProvider.getCurrentUserId().value();

        this.repository.findById(id)
            .filter(token -> token.getUserId().equals(currentUserId))
            .orElseThrow(AccessTokenNotFoundException::new);

        this.repository.deleteById(id);

        return null;
    }
}
