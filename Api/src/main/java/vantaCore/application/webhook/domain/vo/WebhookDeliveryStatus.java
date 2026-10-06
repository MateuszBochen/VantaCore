package vantaCore.application.webhook.domain.vo;

/** RETRYING marks a non-terminal attempt (see WebhookDeliveryService's retry loop) - the delivery
 log gets one row per attempt, the last one carrying SUCCESS or FAILED. */
public enum WebhookDeliveryStatus {
    SUCCESS,
    FAILED,
    RETRYING
}
