package vantaCore.application.user.appliaction.query.listUsers;

import java.util.UUID;

public record UserSummaryResult(
    UUID id,
    String name,
    String lastName,
    String email,
    String avatarUrl
) {
}