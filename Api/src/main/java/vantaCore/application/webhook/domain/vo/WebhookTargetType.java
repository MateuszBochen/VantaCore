package vantaCore.application.webhook.domain.vo;

/** GENERIC is the only type with a credential (an HMAC secret, see WebhookSubscriptionAggregate) -
 SLACK/TEAMS/DISCORD each need only their own provider incoming-webhook URL, which is already its
 own secret, so no separate credential storage exists for those three. */
public enum WebhookTargetType {
    GENERIC,
    SLACK,
    TEAMS,
    DISCORD
}
