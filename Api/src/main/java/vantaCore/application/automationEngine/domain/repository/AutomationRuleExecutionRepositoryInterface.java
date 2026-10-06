package vantaCore.application.automationEngine.domain.repository;

import vantaCore.application.automationEngine.domain.AutomationRuleExecutionAggregate;

import java.util.List;
import java.util.UUID;

public interface AutomationRuleExecutionRepositoryInterface {

    /** append-only - always an insert, never an update (see AutomationRuleExecutionAggregate) */
    void save(AutomationRuleExecutionAggregate execution);

    /** Paginated (0-indexed page, page size = limit), newest executedAt first. */
    AutomationRuleExecutionPage findPageByRuleId(UUID ruleId, int page, int limit);

    record AutomationRuleExecutionPage(List<AutomationRuleExecutionAggregate> items, long total) {
    }
}
