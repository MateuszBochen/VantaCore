package vantaCore.application.webhook.infrastructure.persistence.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import vantaCore.application.webhook.domain.WebhookSubscriptionAggregate;
import vantaCore.application.webhook.domain.WebhookSubscriptionSnapshot;
import vantaCore.application.webhook.domain.vo.WebhookEventType;
import vantaCore.application.webhook.domain.vo.WebhookSubscriptionId;
import vantaCore.application.webhook.domain.vo.WebhookTargetType;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "webhook_subscriptions")
public class WebhookSubscriptionEntity {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<Set<WebhookEventType>> EVENT_TYPES_TYPE = new TypeReference<>() {};

    @Id
    private UUID id;

    private UUID projectId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "event_types", columnDefinition = "jsonb", nullable = false)
    private String eventTypes;

    @Enumerated(EnumType.STRING)
    private WebhookTargetType targetType;

    private String targetUrl;
    private String encryptedSecret;
    private boolean enabled;
    private UUID createdByUserId;
    private Instant createdAt;

    // Hibernate requires it
    protected WebhookSubscriptionEntity() {}

    private WebhookSubscriptionEntity(
        UUID id,
        UUID projectId,
        String eventTypes,
        WebhookTargetType targetType,
        String targetUrl,
        String encryptedSecret,
        boolean enabled,
        UUID createdByUserId,
        Instant createdAt
    ) {
        this.id = id;
        this.projectId = projectId;
        this.eventTypes = eventTypes;
        this.targetType = targetType;
        this.targetUrl = targetUrl;
        this.encryptedSecret = encryptedSecret;
        this.enabled = enabled;
        this.createdByUserId = createdByUserId;
        this.createdAt = createdAt;
    }

    public static WebhookSubscriptionEntity fromDomain(WebhookSubscriptionAggregate subscription, String encryptedSecret) {
        return new WebhookSubscriptionEntity(
            subscription.getId().value(),
            subscription.getProjectId(),
            writeJson(subscription.getEventTypes()),
            subscription.getTargetType(),
            subscription.getTargetUrl(),
            encryptedSecret,
            subscription.isEnabled(),
            subscription.getCreatedByUserId(),
            subscription.getCreatedAt()
        );
    }

    public String getEncryptedSecret() {
        return encryptedSecret;
    }

    public WebhookSubscriptionSnapshot toDomain(String decryptedSecret) {
        return new WebhookSubscriptionSnapshot(
            new WebhookSubscriptionId(this.id),
            this.projectId,
            readJson(this.eventTypes),
            this.targetType,
            this.targetUrl,
            decryptedSecret,
            this.enabled,
            this.createdByUserId,
            this.createdAt
        );
    }

    private static String writeJson(Object value) {
        try {
            return MAPPER.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize webhook subscription", e);
        }
    }

    private static Set<WebhookEventType> readJson(String json) {
        try {
            return MAPPER.readValue(json, EVENT_TYPES_TYPE);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to deserialize webhook subscription", e);
        }
    }
}
