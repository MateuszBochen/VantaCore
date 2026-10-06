package vantaCore.ui.http.rest.controller.project;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.application.webhook.appliaction.command.deleteWebhookSubscription.DeleteWebhookSubscriptionCommand;
import vantaCore.application.webhook.appliaction.command.testWebhookSubscription.TestWebhookSubscriptionCommand;
import vantaCore.application.webhook.appliaction.command.updateWebhookSubscription.UpdateWebhookSubscriptionCommand;
import vantaCore.application.webhook.appliaction.dto.UpdateWebhookSubscriptionRequest;
import vantaCore.application.webhook.appliaction.dto.WebhookSubscriptionRequest;
import vantaCore.application.webhook.appliaction.query.createWebhookSubscription.CreateWebhookSubscriptionQuery;
import vantaCore.application.webhook.appliaction.query.createWebhookSubscription.WebhookSubscriptionResult;
import vantaCore.application.webhook.appliaction.query.listWebhookDeliveries.ListWebhookDeliveriesQuery;
import vantaCore.application.webhook.appliaction.query.listWebhookDeliveries.WebhookDeliveryResult;
import vantaCore.application.webhook.appliaction.query.listWebhookSubscriptions.ListWebhookSubscriptionsQuery;
import vantaCore.application.webhook.appliaction.query.listWebhookSubscriptions.WebhookSubscriptionSummaryResult;
import vantaCore.application.webhook.appliaction.query.regenerateWebhookSecret.RegenerateWebhookSecretQuery;
import vantaCore.application.webhook.appliaction.query.regenerateWebhookSecret.WebhookSecretResult;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Empty;
import vantaCore.ui.http.rest.response.dto.Many;
import vantaCore.ui.http.rest.response.dto.Single;

import java.util.UUID;

@RestController
@RequestMapping("/api/project/{projectId}/webhook")
final public class WebhookSubscriptionController {

    private final CommandBusInterface commandBus;
    private final QueryBusInterface queryBus;

    WebhookSubscriptionController(CommandBusInterface commandBus, QueryBusInterface queryBus) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }

    @GetMapping
    public OpenApiResponse<Many<WebhookSubscriptionSummaryResult>> listSubscriptions(@PathVariable UUID projectId) throws Exception {
        Collection<WebhookSubscriptionSummaryResult> result = this.queryBus.ask(new ListWebhookSubscriptionsQuery(projectId));

        return OpenApiResponse.many(result, HttpStatus.OK);
    }

    @PostMapping
    public OpenApiResponse<Single<WebhookSubscriptionResult>> createSubscription(
        @PathVariable UUID projectId,
        @RequestBody WebhookSubscriptionRequest request
    ) throws Exception {

        Item<WebhookSubscriptionResult> result = this.queryBus.ask(new CreateWebhookSubscriptionQuery(projectId, request));

        return OpenApiResponse.one(result, HttpStatus.CREATED);
    }

    @PutMapping("/{subscriptionId}")
    public OpenApiResponse<Empty> updateSubscription(
        @PathVariable UUID projectId,
        @PathVariable UUID subscriptionId,
        @RequestBody UpdateWebhookSubscriptionRequest request
    ) throws Exception {

        this.commandBus.handle(new UpdateWebhookSubscriptionCommand(projectId, subscriptionId, request));

        return OpenApiResponse.empty(HttpStatus.OK);
    }

    @DeleteMapping("/{subscriptionId}")
    public OpenApiResponse<Empty> deleteSubscription(@PathVariable UUID projectId, @PathVariable UUID subscriptionId) throws Exception {
        this.commandBus.handle(new DeleteWebhookSubscriptionCommand(projectId, subscriptionId));

        return OpenApiResponse.empty(HttpStatus.OK);
    }

    @PostMapping("/{subscriptionId}/secret")
    public OpenApiResponse<Single<WebhookSecretResult>> regenerateSecret(
        @PathVariable UUID projectId,
        @PathVariable UUID subscriptionId
    ) throws Exception {

        Item<WebhookSecretResult> result = this.queryBus.ask(new RegenerateWebhookSecretQuery(projectId, subscriptionId));

        return OpenApiResponse.one(result, HttpStatus.OK);
    }

    @GetMapping("/{subscriptionId}/deliveries")
    public OpenApiResponse<Many<WebhookDeliveryResult>> listDeliveries(
        @PathVariable UUID projectId,
        @PathVariable UUID subscriptionId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int limit
    ) throws Exception {

        Collection<WebhookDeliveryResult> result = this.queryBus.ask(new ListWebhookDeliveriesQuery(projectId, subscriptionId, page, limit));

        return OpenApiResponse.many(result, HttpStatus.OK);
    }

    @PostMapping("/{subscriptionId}/test")
    public OpenApiResponse<Empty> testSubscription(@PathVariable UUID projectId, @PathVariable UUID subscriptionId) throws Exception {
        this.commandBus.handle(new TestWebhookSubscriptionCommand(projectId, subscriptionId));

        return OpenApiResponse.empty(HttpStatus.OK);
    }
}
