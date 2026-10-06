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
import vantaCore.application.automationEngine.domain.AutomationEngineRuleAggregate;
import vantaCore.application.automationEngine.domain.AutomationEngineRuleSnapshot;
import vantaCore.application.automationEngine.domain.vo.AutomationAction;
import vantaCore.application.automationEngine.domain.vo.AutomationCondition;
import vantaCore.application.automationEngine.domain.vo.AutomationEngineRuleId;
import vantaCore.application.automationEngine.domain.vo.AutomationTrigger;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "automation_engine_rules")
public class AutomationEngineRuleEntity {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<List<AutomationCondition>> CONDITIONS_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<AutomationAction>> ACTIONS_TYPE = new TypeReference<>() {};

    @Id
    private UUID id;

    private UUID projectId;
    private String name;
    private boolean enabled;

    @Column(name = "trigger_type")
    private String triggerType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "trigger", columnDefinition = "jsonb", nullable = false)
    private String trigger;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private String conditions;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private String actions;

    private Instant createdAt;
    private Instant updatedAt;

    // Hibernate requires it
    protected AutomationEngineRuleEntity() {}

    private AutomationEngineRuleEntity(
        UUID id,
        UUID projectId,
        String name,
        boolean enabled,
        String triggerType,
        String trigger,
        String conditions,
        String actions,
        Instant createdAt,
        Instant updatedAt
    ) {
        this.id = id;
        this.projectId = projectId;
        this.name = name;
        this.enabled = enabled;
        this.triggerType = triggerType;
        this.trigger = trigger;
        this.conditions = conditions;
        this.actions = actions;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static AutomationEngineRuleEntity fromDomain(AutomationEngineRuleAggregate rule) {
        AutomationEngineRuleSnapshot snapshot = rule.toSnapshot();

        return new AutomationEngineRuleEntity(
            snapshot.id().value(),
            snapshot.projectId(),
            snapshot.name(),
            snapshot.enabled(),
            snapshot.trigger().type().name(),
            writeJson(snapshot.trigger()),
            writeJson(snapshot.conditions()),
            writeJson(snapshot.actions()),
            snapshot.createdAt(),
            snapshot.updatedAt()
        );
    }

    public AutomationEngineRuleAggregate toDomain() {
        return AutomationEngineRuleAggregate.newRule(
            new AutomationEngineRuleId(this.id),
            this.projectId,
            this.name,
            this.enabled,
            readJson(this.trigger, AutomationTrigger.class),
            readJson(this.conditions, CONDITIONS_TYPE),
            readJson(this.actions, ACTIONS_TYPE),
            this.createdAt,
            this.updatedAt
        );
    }

    public String getTriggerType() {
        return triggerType;
    }

    private static String writeJson(Object value) {
        try {
            return MAPPER.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize automation engine rule", e);
        }
    }

    private static <T> T readJson(String json, Class<T> type) {
        try {
            return MAPPER.readValue(json, type);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to deserialize automation engine rule", e);
        }
    }

    private static <T> T readJson(String json, TypeReference<T> type) {
        try {
            return MAPPER.readValue(json, type);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to deserialize automation engine rule", e);
        }
    }
}
