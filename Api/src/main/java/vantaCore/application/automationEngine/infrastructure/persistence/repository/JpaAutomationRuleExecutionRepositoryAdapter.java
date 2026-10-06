package vantaCore.application.automationEngine.infrastructure.persistence.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;
import vantaCore.application.automationEngine.domain.AutomationRuleExecutionAggregate;
import vantaCore.application.automationEngine.domain.repository.AutomationRuleExecutionRepositoryInterface;
import vantaCore.application.automationEngine.infrastructure.persistence.entity.AutomationRuleExecutionEntity;

import java.util.UUID;

@Repository
public class JpaAutomationRuleExecutionRepositoryAdapter implements AutomationRuleExecutionRepositoryInterface {

    private final SpringDataAutomationRuleExecutionRepositoryInterface repository;

    public JpaAutomationRuleExecutionRepositoryAdapter(SpringDataAutomationRuleExecutionRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public void save(AutomationRuleExecutionAggregate execution) {
        this.repository.save(AutomationRuleExecutionEntity.fromDomain(execution));
    }

    @Override
    public AutomationRuleExecutionPage findPageByRuleId(UUID ruleId, int page, int limit) {
        Pageable pageable = PageRequest.of(page, limit, Sort.by(Sort.Direction.DESC, "executedAt"));
        Page<AutomationRuleExecutionEntity> result = this.repository.findAllByRuleId(ruleId, pageable);

        return new AutomationRuleExecutionPage(
            result.getContent().stream().map(AutomationRuleExecutionEntity::toDomain).toList(),
            result.getTotalElements()
        );
    }
}
