package vantaCore.application.automationEngine.appliaction.command.upsertAutomationEngineRule;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.automationEngine.appliaction.dto.UpsertAutomationEngineRuleRequest;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.AUTOMATION_RULE_MANAGE)
final public class UpsertAutomationEngineRuleCommand {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID ruleId;

    @Valid
    @NotNull
    private final UpsertAutomationEngineRuleRequest upsertAutomationEngineRuleRequest;

    public UpsertAutomationEngineRuleCommand(UUID projectId, UUID ruleId, UpsertAutomationEngineRuleRequest upsertAutomationEngineRuleRequest) {
        this.projectId = projectId;
        this.ruleId = ruleId;
        this.upsertAutomationEngineRuleRequest = upsertAutomationEngineRuleRequest;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getRuleId() {
        return ruleId;
    }

    public UpsertAutomationEngineRuleRequest getUpsertAutomationEngineRuleRequest() {
        return upsertAutomationEngineRuleRequest;
    }
}
