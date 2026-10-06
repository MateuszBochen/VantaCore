package vantaCore.application.automationEngine.appliaction.eventHandler;

import org.springframework.stereotype.Component;
import vantaCore.application.automationEngine.appliaction.service.AutomationRuleEngine;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.vcs.domain.event.VcsBranchWasCreated;

@Component
public class RunAutomationRulesWhenVcsBranchWasCreated implements EventHandlerInterface<VcsBranchWasCreated> {

    private final AutomationRuleEngine engine;

    public RunAutomationRulesWhenVcsBranchWasCreated(AutomationRuleEngine engine) {
        this.engine = engine;
    }

    @Override
    public Void handle(VcsBranchWasCreated event) {
        this.engine.onBranchCreated(event.projectId(), event.ticketId());

        return null;
    }
}
