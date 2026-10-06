package vantaCore.application.automationEngine.appliaction.eventHandler;

import org.springframework.stereotype.Component;
import vantaCore.application.automationEngine.appliaction.service.AutomationRuleEngine;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.vcs.domain.event.VcsPullRequestWasOpened;

@Component
public class RunAutomationRulesWhenVcsPullRequestWasOpened implements EventHandlerInterface<VcsPullRequestWasOpened> {

    private final AutomationRuleEngine engine;

    public RunAutomationRulesWhenVcsPullRequestWasOpened(AutomationRuleEngine engine) {
        this.engine = engine;
    }

    @Override
    public Void handle(VcsPullRequestWasOpened event) {
        this.engine.onPullRequestOpened(event.projectId(), event.ticketId());

        return null;
    }
}
