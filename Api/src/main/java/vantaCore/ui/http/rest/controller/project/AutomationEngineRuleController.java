package vantaCore.ui.http.rest.controller.project;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.automationEngine.appliaction.command.deleteAutomationEngineRule.DeleteAutomationEngineRuleCommand;
import vantaCore.application.automationEngine.appliaction.command.upsertAutomationEngineRule.UpsertAutomationEngineRuleCommand;
import vantaCore.application.automationEngine.appliaction.dto.UpsertAutomationEngineRuleRequest;
import vantaCore.application.automationEngine.appliaction.query.listAutomationEngineRules.AutomationEngineRuleResult;
import vantaCore.application.automationEngine.appliaction.query.listAutomationEngineRules.ListAutomationEngineRulesQuery;
import vantaCore.application.automationEngine.appliaction.query.listAutomationRuleExecutions.AutomationRuleExecutionResult;
import vantaCore.application.automationEngine.appliaction.query.listAutomationRuleExecutions.ListAutomationRuleExecutionsQuery;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Empty;
import vantaCore.ui.http.rest.response.dto.Many;

import java.util.UUID;

@RestController
@RequestMapping("/api/project/{projectId}/automation-rule")
final public class AutomationEngineRuleController {

    private final CommandBusInterface commandBus;
    private final QueryBusInterface queryBus;

    AutomationEngineRuleController(CommandBusInterface commandBus, QueryBusInterface queryBus) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }

    @GetMapping
    public OpenApiResponse<Many<AutomationEngineRuleResult>> listAutomationEngineRules(
        @PathVariable UUID projectId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int limit
    ) throws Exception {

        Collection<AutomationEngineRuleResult> result = this.queryBus.ask(new ListAutomationEngineRulesQuery(projectId, page, limit));

        return OpenApiResponse.many(result, HttpStatus.OK);
    }

    @PutMapping("/{ruleId}")
    public OpenApiResponse<Empty> upsertAutomationEngineRule(
        @PathVariable UUID projectId,
        @PathVariable UUID ruleId,
        @RequestBody UpsertAutomationEngineRuleRequest request
    ) throws Exception {

        this.commandBus.handle(new UpsertAutomationEngineRuleCommand(projectId, ruleId, request));

        return OpenApiResponse.empty(HttpStatus.OK);
    }

    @DeleteMapping("/{ruleId}")
    public OpenApiResponse<Empty> deleteAutomationEngineRule(
        @PathVariable UUID projectId,
        @PathVariable UUID ruleId
    ) throws Exception {

        this.commandBus.handle(new DeleteAutomationEngineRuleCommand(projectId, ruleId));

        return OpenApiResponse.empty(HttpStatus.OK);
    }

    @GetMapping("/{ruleId}/executions")
    public OpenApiResponse<Many<AutomationRuleExecutionResult>> listAutomationRuleExecutions(
        @PathVariable UUID projectId,
        @PathVariable UUID ruleId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int limit
    ) throws Exception {

        Collection<AutomationRuleExecutionResult> result = this.queryBus.ask(
            new ListAutomationRuleExecutionsQuery(projectId, ruleId, page, limit)
        );

        return OpenApiResponse.many(result, HttpStatus.OK);
    }
}
