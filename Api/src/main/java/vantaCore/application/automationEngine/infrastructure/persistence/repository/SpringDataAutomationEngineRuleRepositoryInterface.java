package vantaCore.application.automationEngine.infrastructure.persistence.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import vantaCore.application.automationEngine.infrastructure.persistence.entity.AutomationEngineRuleEntity;

import java.util.List;
import java.util.UUID;

public interface SpringDataAutomationEngineRuleRepositoryInterface extends JpaRepository<AutomationEngineRuleEntity, UUID> {

    Page<AutomationEngineRuleEntity> findAllByProjectId(UUID projectId, Pageable pageable);

    List<AutomationEngineRuleEntity> findAllByProjectIdAndEnabledTrueAndTriggerType(UUID projectId, String triggerType);
}
