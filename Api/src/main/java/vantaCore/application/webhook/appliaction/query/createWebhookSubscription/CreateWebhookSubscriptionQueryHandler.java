package vantaCore.application.webhook.appliaction.query.createWebhookSubscription;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;
import vantaCore.application.shared.infrastructure.security.SecretGenerator;
import vantaCore.application.webhook.appliaction.dto.WebhookSubscriptionRequest;
import vantaCore.application.webhook.domain.WebhookSubscriptionAggregate;
import vantaCore.application.webhook.domain.repository.WebhookSubscriptionRepositoryInterface;
import vantaCore.application.webhook.domain.vo.WebhookSubscriptionId;
import vantaCore.application.webhook.domain.vo.WebhookTargetType;

import java.time.Instant;
import java.util.UUID;

@Component
final public class CreateWebhookSubscriptionQueryHandler
    implements QueryHandlerInterface<CreateWebhookSubscriptionQuery, Item<WebhookSubscriptionResult>> {

    private final ProjectAggregateRepositoryInterface projectRepository;
    private final WebhookSubscriptionRepositoryInterface subscriptionRepository;
    private final CurrentUserProviderInterface currentUserProvider;
    private final SecretGenerator secretGenerator;

    public CreateWebhookSubscriptionQueryHandler(
        ProjectAggregateRepositoryInterface projectRepository,
        WebhookSubscriptionRepositoryInterface subscriptionRepository,
        CurrentUserProviderInterface currentUserProvider,
        SecretGenerator secretGenerator
    ) {
        this.projectRepository = projectRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.currentUserProvider = currentUserProvider;
        this.secretGenerator = secretGenerator;
    }

    @Override
    public Item<WebhookSubscriptionResult> handle(CreateWebhookSubscriptionQuery query) {
        ProjectId projectId = new ProjectId(query.getProjectId());
        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);

        WebhookSubscriptionRequest request = query.getWebhookSubscriptionRequest();
        WebhookSubscriptionId subscriptionId = new WebhookSubscriptionId(UUID.randomUUID());

        // Only GENERIC signs its payload (X-VantaCore-Signature) - SLACK/TEAMS/DISCORD have no
        // credential of their own at all, per the sub-project's explicit no-credential-storage
        // constraint (the provider's own incoming-webhook URL is already its own secret).
        String secret = request.getTargetType() == WebhookTargetType.GENERIC ? this.secretGenerator.generate() : null;

        WebhookSubscriptionAggregate subscription = WebhookSubscriptionAggregate.newSubscription(
            subscriptionId,
            projectId.value(),
            request.getEventTypes(),
            request.getTargetType(),
            request.getTargetUrl(),
            secret,
            true,
            this.currentUserProvider.getCurrentUserId().value(),
            Instant.now()
        );

        this.subscriptionRepository.save(subscription);

        WebhookSubscriptionResult result = new WebhookSubscriptionResult(
            subscriptionId.value(), request.getEventTypes(), request.getTargetType(), request.getTargetUrl(), true, secret
        );

        return Item.fromPayload(subscriptionId.toString(), result);
    }
}
