package vantaCore.application.automationEngine.appliaction.eventHandler;

import org.springframework.stereotype.Component;
import vantaCore.application.automationEngine.appliaction.service.AutomationRuleEngine;
import vantaCore.application.comment.domain.event.CommentWasAdded;
import vantaCore.application.shared.application.event.EventHandlerInterface;

@Component
public class RunAutomationRulesWhenCommentWasAdded implements EventHandlerInterface<CommentWasAdded> {

    private final AutomationRuleEngine engine;

    public RunAutomationRulesWhenCommentWasAdded(AutomationRuleEngine engine) {
        this.engine = engine;
    }

    @Override
    public Void handle(CommentWasAdded event) {
        this.engine.onCommentAdded(event.ticket());

        return null;
    }
}
