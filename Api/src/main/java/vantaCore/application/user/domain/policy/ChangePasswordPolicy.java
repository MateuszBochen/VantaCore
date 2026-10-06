package vantaCore.application.user.domain.policy;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.dto.NotificationCollection;
import vantaCore.application.shared.domain.policy.PolicyInterface;
import vantaCore.application.user.domain.UserAggregate;

import java.nio.charset.StandardCharsets;

/** Rules for a user changing their OWN password: they must prove they know the current one (a
 stolen/left-open session alone isn't enough to lock the owner out), and the new one must be at
 least MIN_LENGTH characters, differ from the current one, and fit BCrypt's 72-byte input limit -
 BCrypt ignores (older Spring) or rejects (Spring Security 6.3+) anything past 72 bytes, so a
 longer password is refused up front rather than failing with a 500. */
@Component
final public class ChangePasswordPolicy implements PolicyInterface<ChangePasswordPolicy.Check> {

    public static final int MIN_LENGTH = 8;
    private static final int BCRYPT_MAX_BYTES = 72;

    public record Check(UserAggregate user, String currentPassword, String newPassword) {
    }

    @Override
    public NotificationCollection check(Check value) {
        NotificationCollection notifications = new NotificationCollection();

        if (!value.user().getCredentials().password().isSame(value.currentPassword())) {
            notifications.append(new Notification("invalid-current-password", "Current password is incorrect", true));
            // Nothing else is worth reporting until the caller has proven who they are.
            return notifications;
        }

        String newPassword = value.newPassword();

        if (newPassword.length() < MIN_LENGTH) {
            notifications.append(new Notification(
                "password-too-short",
                "New password must be at least " + MIN_LENGTH + " characters long",
                true
            ));
        }
        if (newPassword.getBytes(StandardCharsets.UTF_8).length > BCRYPT_MAX_BYTES) {
            notifications.append(new Notification("password-too-long", "New password is too long", true));
        }
        if (newPassword.equals(value.currentPassword())) {
            notifications.append(new Notification(
                "password-unchanged",
                "New password must be different from the current one",
                true
            ));
        }

        return notifications;
    }
}
