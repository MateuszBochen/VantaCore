package vantaCore.application.automationEngine.appliaction.command.upsertAutomationEngineRule;

import org.springframework.stereotype.Component;
import vantaCore.application.automationEngine.appliaction.dto.ActionRequest;
import vantaCore.application.automationEngine.appliaction.dto.ConditionRequest;
import vantaCore.application.automationEngine.appliaction.dto.TriggerRequest;
import vantaCore.application.automationEngine.appliaction.dto.UpsertAutomationEngineRuleRequest;
import vantaCore.application.automationEngine.domain.AutomationEngineRuleAggregate;
import vantaCore.application.automationEngine.domain.policy.UpsertAutomationEngineRuleCheck;
import vantaCore.application.automationEngine.domain.policy.UpsertAutomationEngineRulePolicy;
import vantaCore.application.automationEngine.domain.repository.AutomationEngineRuleRepositoryInterface;
import vantaCore.application.automationEngine.domain.vo.AutomationAction;
import vantaCore.application.automationEngine.domain.vo.AutomationCondition;
import vantaCore.application.automationEngine.domain.vo.AutomationEngineRuleId;
import vantaCore.application.automationEngine.domain.vo.AutomationTrigger;
import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Component
final public class UpsertAutomationEngineRuleCommandHandler implements CommandHandlerInterface<UpsertAutomationEngineRuleCommand> {

    private final AutomationEngineRuleRepositoryInterface repository;
    private final ProjectAggregateRepositoryInterface projectRepository;
    private final UpsertAutomationEngineRulePolicy upsertAutomationEngineRulePolicy;

    public UpsertAutomationEngineRuleCommandHandler(
        AutomationEngineRuleRepositoryInterface repository,
        ProjectAggregateRepositoryInterface projectRepository,
        UpsertAutomationEngineRulePolicy upsertAutomationEngineRulePolicy
    ) {
        this.repository = repository;
        this.projectRepository = projectRepository;
        this.upsertAutomationEngineRulePolicy = upsertAutomationEngineRulePolicy;
    }

    @Override
    public Void handle(UpsertAutomationEngineRuleCommand command) {
        ProjectId projectId = new ProjectId(command.getProjectId());
        AutomationEngineRuleId ruleId = new AutomationEngineRuleId(command.getRuleId());

        ProjectAggregate project = this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);

        UpsertAutomationEngineRuleRequest request = command.getUpsertAutomationEngineRuleRequest();
        Instant now = Instant.now();

        AutomationTrigger trigger = toTrigger(request.getTrigger());
        List<AutomationCondition> conditions = toConditions(request.getConditions());
        List<AutomationAction> actions = toActions(request.getActions());

        Optional<AutomationEngineRuleAggregate> existing = this.repository.findById(ruleId);

        AutomationEngineRuleAggregate rule = existing
            .map(current -> current.changeRule(request.getName(), request.getEnabled(), trigger, conditions, actions, now))
            .orElseGet(() -> AutomationEngineRuleAggregate.newRule(
                ruleId, projectId.value(), request.getName(), request.getEnabled(), trigger, conditions, actions, now, now
            ));

        this.upsertAutomationEngineRulePolicy.check(new UpsertAutomationEngineRuleCheck(rule, project)).assertAllowed();

        this.repository.save(rule);

        return null;
    }

    private AutomationTrigger toTrigger(TriggerRequest request) {
        return new AutomationTrigger(request.getType(), request.getParams());
    }

    private List<AutomationCondition> toConditions(List<ConditionRequest> requests) {
        if (requests == null) {
            return List.of();
        }

        return requests.stream()
            .map(request -> new AutomationCondition(request.getId(), request.getField(), request.getOperator(), request.getValue()))
            .toList();
    }

    private List<AutomationAction> toActions(List<ActionRequest> requests) {
        if (requests == null) {
            return List.of();
        }

        return requests.stream()
            .map(request -> new AutomationAction(request.getId(), request.getType(), request.getParams()))
            .toList();
    }
}
