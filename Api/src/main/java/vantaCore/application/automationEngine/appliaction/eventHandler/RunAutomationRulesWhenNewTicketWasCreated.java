package vantaCore.application.automationEngine.appliaction.eventHandler;

import org.springframework.stereotype.Component;
import vantaCore.application.automationEngine.appliaction.service.AutomationRuleEngine;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.ticket.domain.event.NewTicketWasCreated;

@Component
public class RunAutomationRulesWhenNewTicketWasCreated implements EventHandlerInterface<NewTicketWasCreated> {

    private final AutomationRuleEngine engine;

    public RunAutomationRulesWhenNewTicketWasCreated(AutomationRuleEngine engine) {
        this.engine = engine;
    }

    @Override
    public Void handle(NewTicketWasCreated event) {
        this.engine.onTicketCreated(event.ticket());

        return null;
    }
}
