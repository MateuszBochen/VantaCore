package vantaCore.application.automationEngine.appliaction.eventHandler;

import org.springframework.stereotype.Component;
import vantaCore.application.automationEngine.appliaction.service.AutomationRuleEngine;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.ticket.domain.event.TicketStatusWasChanged;

@Component
public class RunAutomationRulesWhenTicketStatusWasChanged implements EventHandlerInterface<TicketStatusWasChanged> {

    private final AutomationRuleEngine engine;

    public RunAutomationRulesWhenTicketStatusWasChanged(AutomationRuleEngine engine) {
        this.engine = engine;
    }

    @Override
    public Void handle(TicketStatusWasChanged event) {
        this.engine.onTicketStatusChanged(event.ticket());

        return null;
    }
}
