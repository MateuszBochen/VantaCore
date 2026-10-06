import type {AutomationTriggerType} from '@/lib/Automation/Type/types';
import type {CollectionResponse} from '@/lib/Request/Type/types';

// Webhooks fire on the same domain event bus Automation Engine's triggers
// already consume (see the sub-project's ADR: "one more consumer of the
// existing event bus, not a separate pipeline") - reusing
// AutomationTriggerType instead of inventing a parallel event vocabulary.
export type WebhookEventType = AutomationTriggerType;

// SLACK/TEAMS/DISCORD are payload-formatting variants of the same delivery
// pipeline, not separate infrastructure (see Solution Design) - each
// configured with just that provider's own incoming-webhook URL as
// `targetUrl`, no HMAC secret of its own, since that URL already acts as
// the provider's own shared secret.
export type WebhookTargetType = 'GENERIC' | 'SLACK' | 'TEAMS' | 'DISCORD';

export type WebhookSubscription = {
  id: string;
  eventTypes: WebhookEventType[];
  targetType: WebhookTargetType;
  targetUrl: string;
  enabled: boolean;
};

export type WebhookResponseItem = {
  id: string;
  resource: WebhookSubscription;
};

export type ListWebhooksResponse = CollectionResponse<WebhookResponseItem>;

export type ListWebhooksResult = {success: true; webhooks: WebhookSubscription[]} | {success: false};

// Only present on the create response (GENERIC only - see WebhookTargetType)
// and on the rotate-secret response - never on a list/get, same one-time-
// reveal convention as Git / VCS Integration's webhook secret.
export type WebhookSecret = {
  secret: string;
};

export type CreateWebhookResponse = {
  id: string;
  type: string;
  resource: WebhookSubscription & Partial<WebhookSecret>;
};

export type CreateWebhookResult =
  | {success: true; webhook: WebhookSubscription & Partial<WebhookSecret>}
  | {success: false};

export type WebhookMutationResult = {success: true} | {success: false};

export type RotateWebhookSecretResponse = {
  id: string;
  type: string;
  resource: WebhookSecret;
};

export type RotateWebhookSecretResult = {success: true; secret: string} | {success: false};

export type WebhookDeliveryStatus = 'SUCCESS' | 'FAILED' | 'RETRYING';

export type WebhookDelivery = {
  id: string;
  eventType: string;
  statusCode: number | null;
  status: WebhookDeliveryStatus;
  attempt: number;
  deliveredAt: string;
};

export type WebhookDeliveryResponseItem = {
  id: string;
  resource: WebhookDelivery;
};

export type ListWebhookDeliveriesResponse = CollectionResponse<WebhookDeliveryResponseItem>;

export type ListWebhookDeliveriesResult = {success: true; deliveries: WebhookDelivery[]} | {success: false};

export type TestWebhookResult = {success: true} | {success: false};
