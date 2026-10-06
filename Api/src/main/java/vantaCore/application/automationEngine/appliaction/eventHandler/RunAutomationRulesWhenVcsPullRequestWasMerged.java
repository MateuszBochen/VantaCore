package vantaCore.application.automationEngine.appliaction.eventHandler;

import org.springframework.stereotype.Component;
import vantaCore.application.automationEngine.appliaction.service.AutomationRuleEngine;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.vcs.domain.event.VcsPullRequestWasMerged;

@Component
public class RunAutomationRulesWhenVcsPullRequestWasMerged implements EventHandlerInterface<VcsPullRequestWasMerged> {

    private final AutomationRuleEngine engine;

    public RunAutomationRulesWhenVcsPullRequestWasMerged(AutomationRuleEngine engine) {
        this.engine = engine;
    }

    @Override
    public Void handle(VcsPullRequestWasMerged event) {
        this.engine.onPullRequestMerged(event.projectId(), event.ticketId());

        return null;
    }
}
