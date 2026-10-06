package vantaCore.application.webhook.appliaction.query.listWebhookSubscriptions;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.webhook.domain.WebhookSubscriptionSnapshot;
import vantaCore.application.webhook.domain.repository.WebhookSubscriptionRepositoryInterface;

import java.util.List;

@Component
final public class ListWebhookSubscriptionsQueryHandler
    implements QueryHandlerInterface<ListWebhookSubscriptionsQuery, Collection<WebhookSubscriptionSummaryResult>> {

    private final ProjectAggregateRepositoryInterface projectRepository;
    private final WebhookSubscriptionRepositoryInterface subscriptionRepository;

    public ListWebhookSubscriptionsQueryHandler(
        ProjectAggregateRepositoryInterface projectRepository,
        WebhookSubscriptionRepositoryInterface subscriptionRepository
    ) {
        this.projectRepository = projectRepository;
        this.subscriptionRepository = subscriptionRepository;
    }

    @Override
    public Collection<WebhookSubscriptionSummaryResult> handle(ListWebhookSubscriptionsQuery query) {
        ProjectId projectId = new ProjectId(query.getProjectId());
        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);

        List<WebhookSubscriptionSnapshot> subscriptions = this.subscriptionRepository.findAllByProjectId(projectId.value());

        List<Item<WebhookSubscriptionSummaryResult>> items = subscriptions.stream()
            .map(subscription -> new WebhookSubscriptionSummaryResult(
                subscription.id().value(), subscription.eventTypes(), subscription.targetType(), subscription.targetUrl(), subscription.enabled()
            ))
            .map(result -> Item.fromPayload(result.id().toString(), result))
            .toList();

        return new Collection<>(0, items.size(), items.size(), items);
    }
}
