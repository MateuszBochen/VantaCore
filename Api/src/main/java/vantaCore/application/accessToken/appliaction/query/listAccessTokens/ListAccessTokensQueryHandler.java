package vantaCore.application.accessToken.appliaction.query.listAccessTokens;

import org.springframework.stereotype.Component;
import vantaCore.application.accessToken.domain.PersonalAccessTokenAggregate;
import vantaCore.application.accessToken.domain.repository.PersonalAccessTokenRepositoryInterface;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;

/** Newest first. Expired tokens are still listed (flagged) so the user can see and delete them. */
@Component
final public class ListAccessTokensQueryHandler implements QueryHandlerInterface<ListAccessTokensQuery, Collection<AccessTokenResult>> {

    private final PersonalAccessTokenRepositoryInterface repository;
    private final CurrentUserProviderInterface currentUserProvider;

    public ListAccessTokensQueryHandler(PersonalAccessTokenRepositoryInterface repository, CurrentUserProviderInterface currentUserProvider) {
        this.repository = repository;
        this.currentUserProvider = currentUserProvider;
    }

    @Override
    public Collection<AccessTokenResult> handle(ListAccessTokensQuery query) {
        Instant now = Instant.now();

        List<Item<AccessTokenResult>> items = this.repository.findAllByUserId(this.currentUserProvider.getCurrentUserId().value()).stream()
            .sorted(Comparator.comparing(PersonalAccessTokenAggregate::getCreatedAt).reversed())
            .map(token -> Item.fromPayload(token.getId().value().toString(), new AccessTokenResult(
                token.getId().value(),
                token.getName(),
                token.getTokenPrefix(),
                token.getScopes().stream().map(Resource::getCode).sorted().toList(),
                token.getCreatedAt(),
                token.getExpiresAt(),
                token.getLastUsedAt(),
                token.isExpired(now)
            )))
            .toList();

        return new Collection<>(0, items.size(), items.size(), items);
    }
}
