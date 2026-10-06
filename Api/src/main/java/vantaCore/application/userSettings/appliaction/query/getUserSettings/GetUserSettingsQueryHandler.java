package vantaCore.application.userSettings.appliaction.query.getUserSettings;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;
import vantaCore.application.userSettings.domain.repository.UserSettingsRepositoryInterface;
import vantaCore.application.user.domain.vo.UserId;

import java.util.Map;

@Component
final public class GetUserSettingsQueryHandler implements QueryHandlerInterface<GetUserSettingsQuery, Item<Map<String, Object>>> {

    private final UserSettingsRepositoryInterface repository;
    private final CurrentUserProviderInterface currentUserProvider;

    public GetUserSettingsQueryHandler(UserSettingsRepositoryInterface repository, CurrentUserProviderInterface currentUserProvider) {
        this.repository = repository;
        this.currentUserProvider = currentUserProvider;
    }

    @Override
    public Item<Map<String, Object>> handle(GetUserSettingsQuery query) {
        UserId userId = this.currentUserProvider.getCurrentUserId();

        // No settings saved yet is not an error - the frontend's own contract already treats a
        // missing key as "use the built-in default" for everything it reads out of this blob.
        Map<String, Object> settings = this.repository.findByUserId(userId.value())
            .map(aggregate -> aggregate.getSettings())
            .orElse(Map.of());

        return Item.fromPayload(userId.toString(), settings);
    }
}
