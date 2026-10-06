package vantaCore.application.userSettings.appliaction.query.getAppSettings;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;
import vantaCore.application.user.domain.vo.UserId;
import vantaCore.application.userSettings.domain.repository.UserSettingsRepositoryInterface;

import java.util.Map;

@Component
final public class GetAppSettingsQueryHandler implements QueryHandlerInterface<GetAppSettingsQuery, Item<AppSettingsResult>> {

    private final UserSettingsRepositoryInterface userSettingsRepository;
    private final CurrentUserProviderInterface currentUserProvider;

    public GetAppSettingsQueryHandler(
        UserSettingsRepositoryInterface userSettingsRepository,
        CurrentUserProviderInterface currentUserProvider
    ) {
        this.userSettingsRepository = userSettingsRepository;
        this.currentUserProvider = currentUserProvider;
    }

    @Override
    public Item<AppSettingsResult> handle(GetAppSettingsQuery query) {
        UserId userId = this.currentUserProvider.getCurrentUserId();

        Map<String, Object> userSettings = this.userSettingsRepository.findByUserId(userId.value())
            .map(aggregate -> aggregate.getSettings())
            .orElse(Map.of());

        return Item.fromPayload(userId.toString(), new AppSettingsResult(userSettings));
    }
}
