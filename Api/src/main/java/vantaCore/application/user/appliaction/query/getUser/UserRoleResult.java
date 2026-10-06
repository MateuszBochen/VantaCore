package vantaCore.application.user.appliaction.query.getUser;

import java.util.UUID;

public record UserRoleResult(UUID id, String name, boolean isSystem) {
}
