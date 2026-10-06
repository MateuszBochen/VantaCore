package vantaCore.application.user.appliaction.query.getUser;

import java.util.List;
import java.util.UUID;

public record UserResult(
    UUID id,
    String firstName,
    String lastName,
    String email,
    String avatarUrl,
    List<UserRoleResult> roles
) {
}
