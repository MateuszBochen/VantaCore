package vantaCore.application.automationEngine.appliaction.eventHandler;

import org.springframework.stereotype.Component;
import vantaCore.application.automationEngine.appliaction.service.AutomationRuleEngine;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.vcs.domain.event.VcsCommitWasPushed;

@Component
public class RunAutomationRulesWhenVcsCommitWasPushed implements EventHandlerInterface<VcsCommitWasPushed> {

    private final AutomationRuleEngine engine;

    public RunAutomationRulesWhenVcsCommitWasPushed(AutomationRuleEngine engine) {
        this.engine = engine;
    }

    @Override
    public Void handle(VcsCommitWasPushed event) {
        this.engine.onCommitPushed(event.projectId(), event.ticketId());

        return null;
    }
}
