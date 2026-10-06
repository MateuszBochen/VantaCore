package vantaCore.application.user.appliaction.command.updateUser;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.exception.UnprocessableEntityException;
import vantaCore.application.user.appliaction.dto.UpdateUserRequest;
import vantaCore.application.user.domain.UserAggregate;
import vantaCore.application.user.domain.repository.UserAggregateRepositoryInterface;
import vantaCore.application.user.domain.vo.Email;
import vantaCore.application.user.domain.vo.UserCredentials;
import vantaCore.application.user.domain.vo.UserId;
import vantaCore.application.user.domain.vo.UserProfile;

import java.util.List;
import java.util.Optional;

@Component
final public class UpdateUserCommandHandler implements CommandHandlerInterface<UpdateUserCommand> {

    private final UserAggregateRepositoryInterface repository;

    public UpdateUserCommandHandler(UserAggregateRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public Void handle(UpdateUserCommand command) {
        UpdateUserRequest request = command.getUpdateUserRequest();
        UserId userId = new UserId(command.getUserId());

        UserAggregate existing = this.repository.findById(userId);

        Email newEmail = new Email(request.getEmail());
        Optional<UserAggregate> sameEmail = this.repository.findByEmail(newEmail);
        if (sameEmail.isPresent() && !sameEmail.get().getId().equals(userId)) {
            throw new UnprocessableEntityException(List.of(new Notification(
                "user-exist",
                "User with same email address already exist",
                true
            )));
        }

        UserAggregate updated = new UserAggregate(
            existing.getId(),
            new UserCredentials(newEmail, existing.getCredentials().password()),
            new UserProfile(request.getFirstName(), request.getLastName(), existing.getProfile().avatarUrl()),
            existing.getRoleIds()
        );

        this.repository.save(updated);

        return null;
    }
}
