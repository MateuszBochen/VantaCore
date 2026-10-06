package vantaCore.application.webhook.infrastructure.persistence.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import vantaCore.application.webhook.domain.WebhookDeliveryAggregate;
import vantaCore.application.webhook.domain.WebhookDeliverySnapshot;
import vantaCore.application.webhook.domain.vo.WebhookDeliveryId;
import vantaCore.application.webhook.domain.vo.WebhookDeliveryStatus;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "webhook_deliveries")
public class WebhookDeliveryEntity {

    @Id
    private UUID id;

    private UUID subscriptionId;
    private String eventType;
    private Integer statusCode;

    @Enumerated(EnumType.STRING)
    private WebhookDeliveryStatus status;

    private int attempt;
    private Instant deliveredAt;

    // Hibernate requires it
    protected WebhookDeliveryEntity() {}

    private WebhookDeliveryEntity(
        UUID id,
        UUID subscriptionId,
        String eventType,
        Integer statusCode,
        WebhookDeliveryStatus status,
        int attempt,
        Instant deliveredAt
    ) {
        this.id = id;
        this.subscriptionId = subscriptionId;
        this.eventType = eventType;
        this.statusCode = statusCode;
        this.status = status;
        this.attempt = attempt;
        this.deliveredAt = deliveredAt;
    }

    public static WebhookDeliveryEntity fromDomain(WebhookDeliveryAggregate delivery) {
        WebhookDeliverySnapshot snapshot = delivery.toSnapshot();

        return new WebhookDeliveryEntity(
            snapshot.id().value(),
            snapshot.subscriptionId(),
            snapshot.eventType(),
            snapshot.statusCode(),
            snapshot.status(),
            snapshot.attempt(),
            snapshot.deliveredAt()
        );
    }

    public WebhookDeliveryAggregate toDomain() {
        return WebhookDeliveryAggregate.newDelivery(
            new WebhookDeliveryId(this.id),
            this.subscriptionId,
            this.eventType,
            this.statusCode,
            this.status,
            this.attempt,
            this.deliveredAt
        );
    }
}
