package vantaCore.application.role.appliaction.query.listRoles;

import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.Set;
import java.util.UUID;

public record RoleSummaryResult(UUID id, String name, boolean isSystem, Set<Resource> resources) {
}
