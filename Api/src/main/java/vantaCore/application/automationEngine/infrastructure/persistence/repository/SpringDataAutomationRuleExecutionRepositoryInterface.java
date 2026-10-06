package vantaCore.application.automationEngine.infrastructure.persistence.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import vantaCore.application.automationEngine.infrastructure.persistence.entity.AutomationRuleExecutionEntity;

import java.util.UUID;

public interface SpringDataAutomationRuleExecutionRepositoryInterface extends JpaRepository<AutomationRuleExecutionEntity, UUID> {

    Page<AutomationRuleExecutionEntity> findAllByRuleId(UUID ruleId, Pageable pageable);
}
