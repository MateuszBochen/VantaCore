package vantaCore.application.accessToken.domain.policy;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.dto.NotificationCollection;
import vantaCore.application.shared.domain.accessControl.Resource;
import vantaCore.application.shared.domain.policy.PolicyInterface;

import java.time.Instant;
import java.util.List;
import java.util.Set;

/** - Not from a token-authenticated request: a leaked token must not be able to mint itself more
     (longer-lived/wider) tokens - creating one needs a real login session.
   - Unknown resource codes are rejected rather than silently dropped.
   - A token can only be narrowed to resources the user actually has right now - scoping to more
     would be meaningless (effective permissions are always intersected with the user's) and would
     just confuse the user about what the token can do.
   - Expiry, if set, must be in the future; at most MAX_TOKENS_PER_USER live tokens per user. */
@Component
final public class CreateAccessTokenPolicy implements PolicyInterface<CreateAccessTokenPolicy.Check> {

    public static final int MAX_TOKENS_PER_USER = 50;

    public record Check(
        boolean requestedWithAccessToken,
        Set<Resource> scopes,
        List<String> unknownResourceCodes,
        Set<Resource> userResources,
        Instant expiresAt,
        long existingTokenCount,
        Instant now
    ) {
    }

    @Override
    public NotificationCollection check(Check value) {
        NotificationCollection notifications = new NotificationCollection();

        if (value.requestedWithAccessToken()) {
            notifications.append(new Notification(
                "access-token-requires-login",
                "Access tokens can only be created from a logged-in session, not with another access token",
                true
            ));
            return notifications;
        }

        if (!value.unknownResourceCodes().isEmpty()) {
            notifications.append(new Notification(
                "access-token-unknown-resource",
                "Unknown permission(s): " + String.join(", ", value.unknownResourceCodes()),
                true
            ));
        }

        List<String> notGranted = value.scopes().stream()
            .filter(resource -> !value.userResources().contains(resource))
            .map(Resource::getCode)
            .sorted()
            .toList();
        if (!notGranted.isEmpty()) {
            notifications.append(new Notification(
                "access-token-scope-not-granted",
                "You don't have these permission(s) yourself: " + String.join(", ", notGranted),
                true
            ));
        }

        if (value.expiresAt() != null && !value.expiresAt().isAfter(value.now())) {
            notifications.append(new Notification("access-token-expiry-in-past", "Expiry date must be in the future", true));
        }

        if (value.existingTokenCount() >= MAX_TOKENS_PER_USER) {
            notifications.append(new Notification(
                "access-token-limit-reached",
                "You can have at most " + MAX_TOKENS_PER_USER + " access tokens - revoke one you no longer use",
                true
            ));
        }

        return notifications;
    }
}
