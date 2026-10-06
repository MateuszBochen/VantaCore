package vantaCore.application.automationEngine.appliaction.command.deleteAutomationEngineRule;

import org.springframework.stereotype.Component;
import vantaCore.application.automationEngine.domain.AutomationEngineRuleAggregate;
import vantaCore.application.automationEngine.domain.repository.AutomationEngineRuleRepositoryInterface;
import vantaCore.application.automationEngine.domain.vo.AutomationEngineRuleId;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.exception.AutomationEngineRuleNotFoundException;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;

@Component
final public class DeleteAutomationEngineRuleCommandHandler implements CommandHandlerInterface<DeleteAutomationEngineRuleCommand> {

    private final ProjectAggregateRepositoryInterface projectRepository;
    private final AutomationEngineRuleRepositoryInterface repository;

    public DeleteAutomationEngineRuleCommandHandler(
        ProjectAggregateRepositoryInterface projectRepository,
        AutomationEngineRuleRepositoryInterface repository
    ) {
        this.projectRepository = projectRepository;
        this.repository = repository;
    }

    @Override
    public Void handle(DeleteAutomationEngineRuleCommand command) {
        ProjectId projectId = new ProjectId(command.getProjectId());
        AutomationEngineRuleId ruleId = new AutomationEngineRuleId(command.getRuleId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);

        AutomationEngineRuleAggregate existing = this.repository.findById(ruleId)
            .orElseThrow(AutomationEngineRuleNotFoundException::new);

        // Don't distinguish "doesn't exist" from "belongs to a different project" - same
        // private-ish sub-resource reasoning as DeleteWorklogCommandHandler.
        if (!existing.toSnapshot().projectId().equals(projectId.value())) {
            throw new AutomationEngineRuleNotFoundException();
        }

        this.repository.deleteById(ruleId);

        return null;
    }
}
