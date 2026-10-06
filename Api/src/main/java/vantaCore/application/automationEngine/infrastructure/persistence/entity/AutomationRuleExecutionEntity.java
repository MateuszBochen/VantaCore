package vantaCore.application.automationEngine.infrastructure.persistence.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import vantaCore.application.automationEngine.domain.AutomationRuleExecutionAggregate;
import vantaCore.application.automationEngine.domain.AutomationRuleExecutionSnapshot;
import vantaCore.application.automationEngine.domain.vo.ExecutedActionResult;
import vantaCore.application.automationEngine.domain.vo.ExecutionStatus;
import vantaCore.application.automationEngine.domain.vo.TriggerType;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "automation_rule_executions")
public class AutomationRuleExecutionEntity {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<List<ExecutedActionResult>> EXECUTED_ACTIONS_TYPE = new TypeReference<>() {};

    @Id
    private UUID id;

    private UUID ruleId;
    private UUID projectId;
    private UUID ticketId;

    @Column(name = "trigger_type")
    private String triggerType;

    private String status;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "executed_actions", columnDefinition = "jsonb", nullable = false)
    private String executedActions;

    @Column(columnDefinition = "text")
    private String errorMessage;

    private int depth;
    private Instant executedAt;

    // Hibernate requires it
    protected AutomationRuleExecutionEntity() {}

    private AutomationRuleExecutionEntity(
        UUID id,
        UUID ruleId,
        UUID projectId,
        UUID ticketId,
        String triggerType,
        String status,
        String executedActions,
        String errorMessage,
        int depth,
        Instant executedAt
    ) {
        this.id = id;
        this.ruleId = ruleId;
        this.projectId = projectId;
        this.ticketId = ticketId;
        this.triggerType = triggerType;
        this.status = status;
        this.executedActions = executedActions;
        this.errorMessage = errorMessage;
        this.depth = depth;
        this.executedAt = executedAt;
    }

    public static AutomationRuleExecutionEntity fromDomain(AutomationRuleExecutionAggregate execution) {
        AutomationRuleExecutionSnapshot snapshot = execution.toSnapshot();

        return new AutomationRuleExecutionEntity(
            snapshot.id(),
            snapshot.ruleId(),
            snapshot.projectId(),
            snapshot.ticketId(),
            snapshot.triggerType().name(),
            snapshot.status().name(),
            writeJson(snapshot.executedActions()),
            snapshot.errorMessage(),
            snapshot.depth(),
            snapshot.executedAt()
        );
    }

    public AutomationRuleExecutionAggregate toDomain() {
        return AutomationRuleExecutionAggregate.newEntry(
            this.id,
            this.ruleId,
            this.projectId,
            this.ticketId,
            TriggerType.valueOf(this.triggerType),
            ExecutionStatus.valueOf(this.status),
            readJson(this.executedActions),
            this.errorMessage,
            this.depth,
            this.executedAt
        );
    }

    private static String writeJson(List<ExecutedActionResult> executedActions) {
        try {
            return MAPPER.writeValueAsString(executedActions);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize automation rule execution", e);
        }
    }

    private static List<ExecutedActionResult> readJson(String json) {
        try {
            return MAPPER.readValue(json, EXECUTED_ACTIONS_TYPE);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to deserialize automation rule execution", e);
        }
    }
}
