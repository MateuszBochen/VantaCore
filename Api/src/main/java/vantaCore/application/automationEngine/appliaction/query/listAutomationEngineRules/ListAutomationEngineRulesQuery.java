package vantaCore.application.automationEngine.appliaction.query.listAutomationEngineRules;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.AUTOMATION_RULE_VIEW)
final public class ListAutomationEngineRulesQuery {

    @NotNull
    private final UUID projectId;

    @Min(0)
    private final int page;

    @Min(1)
    private final int limit;

    public ListAutomationEngineRulesQuery(UUID projectId, int page, int limit) {
        this.projectId = projectId;
        this.page = page;
        this.limit = limit;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public int getPage() {
        return page;
    }

    public int getLimit() {
        return limit;
    }
}
