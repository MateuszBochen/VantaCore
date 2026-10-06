package vantaCore.application.webhook.appliaction.query.regenerateWebhookSecret;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.exception.UnprocessableEntityException;
import vantaCore.application.shared.application.exception.WebhookSubscriptionNotFoundException;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.shared.infrastructure.security.SecretGenerator;
import vantaCore.application.webhook.domain.WebhookSubscriptionAggregate;
import vantaCore.application.webhook.domain.WebhookSubscriptionSnapshot;
import vantaCore.application.webhook.domain.repository.WebhookSubscriptionRepositoryInterface;
import vantaCore.application.webhook.domain.vo.WebhookSubscriptionId;
import vantaCore.application.webhook.domain.vo.WebhookTargetType;

import java.util.List;

@Component
final public class RegenerateWebhookSecretQueryHandler
    implements QueryHandlerInterface<RegenerateWebhookSecretQuery, Item<WebhookSecretResult>> {

    private final WebhookSubscriptionRepositoryInterface subscriptionRepository;
    private final SecretGenerator secretGenerator;

    public RegenerateWebhookSecretQueryHandler(
        WebhookSubscriptionRepositoryInterface subscriptionRepository,
        SecretGenerator secretGenerator
    ) {
        this.subscriptionRepository = subscriptionRepository;
        this.secretGenerator = secretGenerator;
    }

    @Override
    public Item<WebhookSecretResult> handle(RegenerateWebhookSecretQuery query) {
        WebhookSubscriptionId subscriptionId = new WebhookSubscriptionId(query.getSubscriptionId());

        WebhookSubscriptionSnapshot snapshot = this.subscriptionRepository.findById(subscriptionId)
            .orElseThrow(WebhookSubscriptionNotFoundException::new);

        if (!snapshot.projectId().equals(query.getProjectId())) {
            throw new WebhookSubscriptionNotFoundException();
        }

        if (snapshot.targetType() != WebhookTargetType.GENERIC) {
            throw new UnprocessableEntityException(List.of(new Notification(
                "webhook-secret-not-applicable",
                "Only GENERIC webhook subscriptions have a secret to regenerate",
                true
            )));
        }

        String newSecret = this.secretGenerator.generate();

        WebhookSubscriptionAggregate subscription = WebhookSubscriptionAggregate.newSubscription(
            snapshot.id(), snapshot.projectId(), snapshot.eventTypes(), snapshot.targetType(), snapshot.targetUrl(),
            snapshot.secret(), snapshot.enabled(), snapshot.createdByUserId(), snapshot.createdAt()
        ).regenerateSecret(newSecret);

        this.subscriptionRepository.save(subscription);

        return Item.fromPayload(subscriptionId.toString(), new WebhookSecretResult(newSecret));
    }
}
