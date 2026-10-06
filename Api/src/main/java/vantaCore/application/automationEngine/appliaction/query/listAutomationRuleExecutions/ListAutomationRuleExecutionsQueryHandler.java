package vantaCore.application.automationEngine.appliaction.query.listAutomationRuleExecutions;

import org.springframework.stereotype.Component;
import vantaCore.application.automationEngine.domain.AutomationRuleExecutionAggregate;
import vantaCore.application.automationEngine.domain.AutomationRuleExecutionSnapshot;
import vantaCore.application.automationEngine.domain.repository.AutomationEngineRuleRepositoryInterface;
import vantaCore.application.automationEngine.domain.repository.AutomationRuleExecutionRepositoryInterface;
import vantaCore.application.automationEngine.domain.repository.AutomationRuleExecutionRepositoryInterface.AutomationRuleExecutionPage;
import vantaCore.application.automationEngine.domain.vo.AutomationEngineRuleId;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.exception.AutomationEngineRuleNotFoundException;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;

import java.util.List;

@Component
final public class ListAutomationRuleExecutionsQueryHandler implements QueryHandlerInterface<ListAutomationRuleExecutionsQuery, Collection<AutomationRuleExecutionResult>> {

    private final AutomationRuleExecutionRepositoryInterface repository;
    private final AutomationEngineRuleRepositoryInterface ruleRepository;
    private final ProjectAggregateRepositoryInterface projectRepository;

    public ListAutomationRuleExecutionsQueryHandler(
        AutomationRuleExecutionRepositoryInterface repository,
        AutomationEngineRuleRepositoryInterface ruleRepository,
        ProjectAggregateRepositoryInterface projectRepository
    ) {
        this.repository = repository;
        this.ruleRepository = ruleRepository;
        this.projectRepository = projectRepository;
    }

    @Override
    public Collection<AutomationRuleExecutionResult> handle(ListAutomationRuleExecutionsQuery query) {
        ProjectId projectId = new ProjectId(query.getProjectId());
        AutomationEngineRuleId ruleId = new AutomationEngineRuleId(query.getRuleId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);

        var rule = this.ruleRepository.findById(ruleId).orElseThrow(AutomationEngineRuleNotFoundException::new);
        if (!rule.toSnapshot().projectId().equals(projectId.value())) {
            throw new AutomationEngineRuleNotFoundException();
        }

        AutomationRuleExecutionPage page = this.repository.findPageByRuleId(ruleId.value(), query.getPage(), query.getLimit());

        List<Item<AutomationRuleExecutionResult>> items = page.items().stream()
            .map(AutomationRuleExecutionAggregate::toSnapshot)
            .map(execution -> Item.fromPayload(execution.id().toString(), toResult(execution)))
            .toList();

        return new Collection<>(query.getPage(), query.getLimit(), page.total(), items);
    }

    private AutomationRuleExecutionResult toResult(AutomationRuleExecutionSnapshot execution) {
        return new AutomationRuleExecutionResult(
            execution.id(),
            execution.ruleId(),
            execution.projectId(),
            execution.ticketId(),
            execution.triggerType(),
            execution.status(),
            execution.executedActions(),
            execution.errorMessage(),
            execution.depth(),
            execution.executedAt()
        );
    }
}
