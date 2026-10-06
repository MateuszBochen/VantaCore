package vantaCore.application.automationEngine.infrastructure.persistence.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;
import vantaCore.application.automationEngine.domain.AutomationEngineRuleAggregate;
import vantaCore.application.automationEngine.domain.repository.AutomationEngineRuleRepositoryInterface;
import vantaCore.application.automationEngine.domain.vo.AutomationEngineRuleId;
import vantaCore.application.automationEngine.domain.vo.TriggerType;
import vantaCore.application.automationEngine.infrastructure.persistence.entity.AutomationEngineRuleEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class JpaAutomationEngineRuleRepositoryAdapter implements AutomationEngineRuleRepositoryInterface {

    private final SpringDataAutomationEngineRuleRepositoryInterface repository;

    public JpaAutomationEngineRuleRepositoryAdapter(SpringDataAutomationEngineRuleRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public void save(AutomationEngineRuleAggregate rule) {
        this.repository.save(AutomationEngineRuleEntity.fromDomain(rule));
    }

    @Override
    public Optional<AutomationEngineRuleAggregate> findById(AutomationEngineRuleId id) {
        return this.repository.findById(id.value()).map(AutomationEngineRuleEntity::toDomain);
    }

    @Override
    public void deleteById(AutomationEngineRuleId id) {
        this.repository.deleteById(id.value());
    }

    @Override
    public AutomationEngineRulePage findPageByProjectId(UUID projectId, int page, int limit) {
        Pageable pageable = PageRequest.of(page, limit, Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<AutomationEngineRuleEntity> result = this.repository.findAllByProjectId(projectId, pageable);

        return new AutomationEngineRulePage(
            result.getContent().stream().map(AutomationEngineRuleEntity::toDomain).toList(),
            result.getTotalElements()
        );
    }

    @Override
    public List<AutomationEngineRuleAggregate> findAllEnabledByProjectIdAndTriggerType(UUID projectId, TriggerType triggerType) {
        return this.repository.findAllByProjectIdAndEnabledTrueAndTriggerType(projectId, triggerType.name()).stream()
            .map(AutomationEngineRuleEntity::toDomain)
            .toList();
    }
}
