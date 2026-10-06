package vantaCore.application.notification.infrastructure.persistence.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import vantaCore.application.notification.domain.NotificationAggregate;
import vantaCore.application.notification.domain.vo.NotificationId;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "notifications")
public class NotificationEntity {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<Map<String, Object>> PAYLOAD_TYPE = new TypeReference<>() {};

    @Id
    private UUID id;

    private UUID userId;
    private String type;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private String payload;

    private boolean read;
    private boolean pendingDigest;
    private Instant createdAt;

    // Hibernate requires it
    protected NotificationEntity() {}

    private NotificationEntity(
        UUID id,
        UUID userId,
        String type,
        String payload,
        boolean read,
        boolean pendingDigest,
        Instant createdAt
    ) {
        this.id = id;
        this.userId = userId;
        this.type = type;
        this.payload = payload;
        this.read = read;
        this.pendingDigest = pendingDigest;
        this.createdAt = createdAt;
    }

    public static NotificationEntity fromDomain(NotificationAggregate notification) {
        return new NotificationEntity(
            notification.getId().value(),
            notification.getUserId(),
            notification.getType(),
            writePayload(notification.getPayload()),
            notification.isRead(),
            notification.isPendingDigest(),
            notification.getCreatedAt()
        );
    }

    public NotificationAggregate toDomain() {
        return new NotificationAggregate(
            new NotificationId(this.id),
            this.userId,
            this.type,
            readPayload(this.payload),
            this.read,
            this.pendingDigest,
            this.createdAt
        );
    }

    private static String writePayload(Map<String, Object> payload) {
        try {
            return MAPPER.writeValueAsString(payload == null ? Map.of() : payload);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize notification payload", e);
        }
    }

    private static Map<String, Object> readPayload(String json) {
        try {
            return MAPPER.readValue(json, PAYLOAD_TYPE);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to deserialize notification payload", e);
        }
    }
}
