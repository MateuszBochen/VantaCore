package vantaCore.application.automationEngine.appliaction.eventHandler;

import org.springframework.stereotype.Component;
import vantaCore.application.automationEngine.appliaction.service.AutomationRuleEngine;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.vcs.domain.event.VcsPullRequestWasDeclined;

@Component
public class RunAutomationRulesWhenVcsPullRequestWasDeclined implements EventHandlerInterface<VcsPullRequestWasDeclined> {

    private final AutomationRuleEngine engine;

    public RunAutomationRulesWhenVcsPullRequestWasDeclined(AutomationRuleEngine engine) {
        this.engine = engine;
    }

    @Override
    public Void handle(VcsPullRequestWasDeclined event) {
        this.engine.onPullRequestDeclined(event.projectId(), event.ticketId());

        return null;
    }
}
