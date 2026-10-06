package vantaCore.application.automationEngine.appliaction.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

// id/projectId aren't fields here - the frontend's AutomationEngineRule object carries them too
// (the PUT body is "the whole object"), but the path variables are authoritative; any id/projectId
// in the JSON body is simply ignored (Spring's default ObjectMapper tolerates unknown properties),
// same round-trip convenience as SprintTicketRequest's unused projectId.
final public class UpsertAutomationEngineRuleRequest {

    @NotBlank
    private final String name;

    @NotNull
    private final Boolean enabled;

    @Valid
    @NotNull
    private final TriggerRequest trigger;

    @Valid
    private final List<ConditionRequest> conditions;

    @Valid
    private final List<ActionRequest> actions;

    public UpsertAutomationEngineRuleRequest(
        String name,
        Boolean enabled,
        TriggerRequest trigger,
        List<ConditionRequest> conditions,
        List<ActionRequest> actions
    ) {
        this.name = name;
        this.enabled = enabled;
        this.trigger = trigger;
        this.conditions = conditions;
        this.actions = actions;
    }

    public String getName() {
        return name;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public TriggerRequest getTrigger() {
        return trigger;
    }

    public List<ConditionRequest> getConditions() {
        return conditions;
    }

    public List<ActionRequest> getActions() {
        return actions;
    }
}
