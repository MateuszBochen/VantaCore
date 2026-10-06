package vantaCore.application.accessToken.appliaction.query.createAccessToken;

import org.springframework.stereotype.Component;
import vantaCore.application.accessToken.appliaction.dto.CreateAccessTokenRequest;
import vantaCore.application.accessToken.appliaction.service.UserResourceLookup;
import vantaCore.application.accessToken.domain.PersonalAccessTokenAggregate;
import vantaCore.application.accessToken.domain.PersonalAccessTokenAggregate.IssuedAccessToken;
import vantaCore.application.accessToken.domain.policy.CreateAccessTokenPolicy;
import vantaCore.application.accessToken.domain.repository.PersonalAccessTokenRepositoryInterface;
import vantaCore.application.accessToken.domain.vo.AccessTokenId;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;
import vantaCore.application.shared.domain.accessControl.Resource;
import vantaCore.application.user.domain.UserAggregate;
import vantaCore.application.user.domain.repository.UserAggregateRepositoryInterface;

import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Component
final public class CreateAccessTokenQueryHandler implements QueryHandlerInterface<CreateAccessTokenQuery, Item<CreatedAccessTokenResult>> {

    private final PersonalAccessTokenRepositoryInterface repository;
    private final UserAggregateRepositoryInterface userRepository;
    private final UserResourceLookup userResourceLookup;
    private final CurrentUserProviderInterface currentUserProvider;
    private final CreateAccessTokenPolicy policy;

    public CreateAccessTokenQueryHandler(
        PersonalAccessTokenRepositoryInterface repository,
        UserAggregateRepositoryInterface userRepository,
        UserResourceLookup userResourceLookup,
        CurrentUserProviderInterface currentUserProvider,
        CreateAccessTokenPolicy policy
    ) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.userResourceLookup = userResourceLookup;
        this.currentUserProvider = currentUserProvider;
        this.policy = policy;
    }

    @Override
    public Item<CreatedAccessTokenResult> handle(CreateAccessTokenQuery query) {
        CreateAccessTokenRequest request = query.getCreateAccessTokenRequest();
        UserAggregate user = this.userRepository.findById(this.currentUserProvider.getCurrentUserId());
        UUID userId = user.getId().value();
        Instant now = Instant.now();

        Set<Resource> scopes = EnumSet.noneOf(Resource.class);
        List<String> unknownCodes = new ArrayList<>();
        for (String code : request.getResources() == null ? List.<String>of() : request.getResources()) {
            try {
                scopes.add(Resource.fromCode(code));
            } catch (IllegalArgumentException exception) {
                unknownCodes.add(code);
            }
        }

        this.policy.check(new CreateAccessTokenPolicy.Check(
            this.currentUserProvider.isAccessTokenSession(),
            scopes,
            unknownCodes,
            this.userResourceLookup.resourcesOf(user),
            request.getExpiresAt(),
            this.repository.countByUserId(userId),
            now
        )).assertAllowed();

        IssuedAccessToken issued = PersonalAccessTokenAggregate.issue(
            new AccessTokenId(UUID.randomUUID()), userId, request.getName(), scopes, request.getExpiresAt(), now
        );
        this.repository.save(issued.token());

        PersonalAccessTokenAggregate token = issued.token();
        CreatedAccessTokenResult result = new CreatedAccessTokenResult(
            token.getId().value(),
            token.getName(),
            issued.plaintext(),
            token.getTokenPrefix(),
            token.getScopes().stream().map(Resource::getCode).sorted().toList(),
            token.getCreatedAt(),
            token.getExpiresAt()
        );

        return Item.fromPayload(token.getId().value().toString(), result);
    }
}
