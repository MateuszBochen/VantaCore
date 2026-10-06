package vantaCore.application.automationEngine.appliaction.query.listAutomationRuleExecutions;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.AUTOMATION_RULE_VIEW)
final public class ListAutomationRuleExecutionsQuery {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID ruleId;

    @Min(0)
    private final int page;

    @Min(1)
    private final int limit;

    public ListAutomationRuleExecutionsQuery(UUID projectId, UUID ruleId, int page, int limit) {
        this.projectId = projectId;
        this.ruleId = ruleId;
        this.page = page;
        this.limit = limit;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getRuleId() {
        return ruleId;
    }

    public int getPage() {
        return page;
    }

    public int getLimit() {
        return limit;
    }
}
