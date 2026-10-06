package vantaCore.application.user.appliaction.query.getUser;

import org.springframework.stereotype.Component;
import vantaCore.application.role.domain.repository.RoleAggregateRepositoryInterface;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.user.domain.UserAggregate;
import vantaCore.application.user.domain.repository.UserAggregateRepositoryInterface;
import vantaCore.application.user.domain.vo.UserId;

import java.util.List;

@Component
final public class GetUserQueryHandler implements QueryHandlerInterface<GetUserQuery, Item<UserResult>> {

    private final UserAggregateRepositoryInterface userAggregateRepository;
    private final RoleAggregateRepositoryInterface roleAggregateRepository;

    public GetUserQueryHandler(
        UserAggregateRepositoryInterface userAggregateRepository,
        RoleAggregateRepositoryInterface roleAggregateRepository
    ) {
        this.userAggregateRepository = userAggregateRepository;
        this.roleAggregateRepository = roleAggregateRepository;
    }

    @Override
    public Item<UserResult> handle(GetUserQuery query) {
        UserAggregate user = this.userAggregateRepository.findById(new UserId(query.getUserId()));

        List<UserRoleResult> roles = this.roleAggregateRepository.findAllById(user.getRoleIds()).stream()
            .map(role -> new UserRoleResult(role.getId().value(), role.getName(), role.isSystem()))
            .toList();

        UserResult result = new UserResult(
            user.getId().value(),
            user.getProfile().firstName(),
            user.getProfile().lastName(),
            user.getCredentials().email().value(),
            user.getProfile().avatarUrl(),
            roles
        );

        return Item.fromPayload(user.getId().toString(), result);
    }
}
