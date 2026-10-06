package vantaCore.application.automationEngine.appliaction.command.deleteAutomationEngineRule;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.AUTOMATION_RULE_MANAGE)
final public class DeleteAutomationEngineRuleCommand {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID ruleId;

    public DeleteAutomationEngineRuleCommand(UUID projectId, UUID ruleId) {
        this.projectId = projectId;
        this.ruleId = ruleId;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getRuleId() {
        return ruleId;
    }
}
