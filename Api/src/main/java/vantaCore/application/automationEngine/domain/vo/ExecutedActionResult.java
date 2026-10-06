package vantaCore.application.automationEngine.domain.vo;

import java.util.UUID;

public record ExecutedActionResult(UUID actionId, ActionType type, boolean success, String error) {
}
