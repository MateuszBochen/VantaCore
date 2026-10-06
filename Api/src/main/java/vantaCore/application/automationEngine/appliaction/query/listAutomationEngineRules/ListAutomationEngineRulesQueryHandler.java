package vantaCore.application.automationEngine.appliaction.query.listAutomationEngineRules;

import org.springframework.stereotype.Component;
import vantaCore.application.automationEngine.domain.AutomationEngineRuleAggregate;
import vantaCore.application.automationEngine.domain.AutomationEngineRuleSnapshot;
import vantaCore.application.automationEngine.domain.repository.AutomationEngineRuleRepositoryInterface;
import vantaCore.application.automationEngine.domain.repository.AutomationEngineRuleRepositoryInterface.AutomationEngineRulePage;
import vantaCore.application.automationEngine.domain.vo.AutomationAction;
import vantaCore.application.automationEngine.domain.vo.AutomationCondition;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;

import java.util.List;

@Component
final public class ListAutomationEngineRulesQueryHandler implements QueryHandlerInterface<ListAutomationEngineRulesQuery, Collection<AutomationEngineRuleResult>> {

    private final AutomationEngineRuleRepositoryInterface repository;
    private final ProjectAggregateRepositoryInterface projectRepository;

    public ListAutomationEngineRulesQueryHandler(
        AutomationEngineRuleRepositoryInterface repository,
        ProjectAggregateRepositoryInterface projectRepository
    ) {
        this.repository = repository;
        this.projectRepository = projectRepository;
    }

    @Override
    public Collection<AutomationEngineRuleResult> handle(ListAutomationEngineRulesQuery query) {
        ProjectId projectId = new ProjectId(query.getProjectId());
        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);

        AutomationEngineRulePage page = this.repository.findPageByProjectId(projectId.value(), query.getPage(), query.getLimit());

        List<Item<AutomationEngineRuleResult>> items = page.items().stream()
            .map(AutomationEngineRuleAggregate::toSnapshot)
            .map(rule -> Item.fromPayload(rule.id().toString(), toResult(rule)))
            .toList();

        return new Collection<>(query.getPage(), query.getLimit(), page.total(), items);
    }

    public static AutomationEngineRuleResult toResult(AutomationEngineRuleSnapshot rule) {
        return new AutomationEngineRuleResult(
            rule.id().value(),
            rule.projectId(),
            rule.name(),
            rule.enabled(),
            new TriggerResult(rule.trigger().type(), rule.trigger().params()),
            rule.conditions().stream().map(ListAutomationEngineRulesQueryHandler::toConditionResult).toList(),
            rule.actions().stream().map(ListAutomationEngineRulesQueryHandler::toActionResult).toList()
        );
    }

    private static ConditionResult toConditionResult(AutomationCondition condition) {
        return new ConditionResult(condition.id(), condition.field(), condition.operator(), condition.value());
    }

    private static ActionResult toActionResult(AutomationAction action) {
        return new ActionResult(action.id(), action.type(), action.params());
    }
}
