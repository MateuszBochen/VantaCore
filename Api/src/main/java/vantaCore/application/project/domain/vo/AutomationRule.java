package vantaCore.application.project.domain.vo;

import java.util.UUID;

public record AutomationRule(
    UUID id,
    UUID parentTypeId,
    UUID setParentStatusId
) {
    public AutomationRule {
        if (id == null) {
            throw new IllegalArgumentException("AutomationRule id cannot be null");
        }
    }
}
