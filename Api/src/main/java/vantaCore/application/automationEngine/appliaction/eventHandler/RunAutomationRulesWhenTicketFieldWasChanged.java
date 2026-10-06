package vantaCore.application.automationEngine.appliaction.eventHandler;

import org.springframework.stereotype.Component;
import vantaCore.application.automationEngine.appliaction.service.AutomationRuleEngine;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.ticket.domain.event.TicketFieldWasChanged;

@Component
public class RunAutomationRulesWhenTicketFieldWasChanged implements EventHandlerInterface<TicketFieldWasChanged> {

    private final AutomationRuleEngine engine;

    public RunAutomationRulesWhenTicketFieldWasChanged(AutomationRuleEngine engine) {
        this.engine = engine;
    }

    @Override
    public Void handle(TicketFieldWasChanged event) {
        this.engine.onTicketFieldChanged(event.ticket(), event.fieldId());

        return null;
    }
}
