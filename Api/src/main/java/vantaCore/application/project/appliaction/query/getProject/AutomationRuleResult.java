package vantaCore.application.project.appliaction.query.getProject;

import java.util.UUID;

public record AutomationRuleResult(
    UUID id,
    UUID parentTypeId,
    UUID setParentStatusId
) {
}
