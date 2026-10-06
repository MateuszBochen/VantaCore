package vantaCore.application.automationEngine.domain.repository;

import vantaCore.application.automationEngine.domain.AutomationEngineRuleAggregate;
import vantaCore.application.automationEngine.domain.vo.AutomationEngineRuleId;
import vantaCore.application.automationEngine.domain.vo.TriggerType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AutomationEngineRuleRepositoryInterface {

    /** saving aggregate (create or full replace) */
    void save(AutomationEngineRuleAggregate rule);

    Optional<AutomationEngineRuleAggregate> findById(AutomationEngineRuleId id);

    void deleteById(AutomationEngineRuleId id);

    /** Paginated (0-indexed page, page size = limit), newest updatedAt first. */
    AutomationEngineRulePage findPageByProjectId(UUID projectId, int page, int limit);

    /** The execution engine's hot-path lookup - every enabled rule for this project whose trigger
     matches this type, regardless of page/limit (a project's rule count is expected to be small,
     unlike tickets/comments). */
    List<AutomationEngineRuleAggregate> findAllEnabledByProjectIdAndTriggerType(UUID projectId, TriggerType triggerType);

    record AutomationEngineRulePage(List<AutomationEngineRuleAggregate> items, long total) {
    }
}
