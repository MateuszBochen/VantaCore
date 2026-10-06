package vantaCore.application.userSettings.appliaction.command.saveUserSettings;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;
import vantaCore.application.user.domain.vo.UserId;
import vantaCore.application.userSettings.domain.UserSettingsAggregate;
import vantaCore.application.userSettings.domain.repository.UserSettingsRepositoryInterface;

@Component
final public class SaveUserSettingsCommandHandler implements CommandHandlerInterface<SaveUserSettingsCommand> {

    private final UserSettingsRepositoryInterface repository;
    private final CurrentUserProviderInterface currentUserProvider;

    public SaveUserSettingsCommandHandler(UserSettingsRepositoryInterface repository, CurrentUserProviderInterface currentUserProvider) {
        this.repository = repository;
        this.currentUserProvider = currentUserProvider;
    }

    @Override
    public Void handle(SaveUserSettingsCommand command) {
        UserId userId = this.currentUserProvider.getCurrentUserId();

        this.repository.save(UserSettingsAggregate.of(userId.value(), command.getSettings()));

        return null;
    }
}
