-- Integrations & Webhooks - see the "one more consumer of the existing domain event bus" ADR
-- (Webhooks/Automation Engine/Audit Log are three independent consumers of the same event stream,
-- not three separate pipelines).

-- encrypted_secret is null for SLACK/TEAMS/DISCORD - the provider's own incoming-webhook URL is
-- already its own secret, no HMAC signing needed for those three (see WebhookTargetType). event_types
-- is a jsonb array (Set<WebhookEventType>), same pattern as every other small-array-on-an-aggregate
-- column in this app.
CREATE TABLE webhook_subscriptions (
    id uuid NOT NULL,
    project_id uuid NOT NULL,
    event_types jsonb NOT NULL,
    target_type character varying(20) NOT NULL,
    target_url character varying(1000) NOT NULL,
    encrypted_secret text,
    enabled boolean NOT NULL DEFAULT true,
    created_by_user_id uuid,
    created_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY webhook_subscriptions ADD CONSTRAINT webhook_subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY webhook_subscriptions ADD CONSTRAINT fk_webhook_subscriptions_project FOREIGN KEY (project_id) REFERENCES projects(id);

CREATE INDEX idx_webhook_subscriptions_project ON webhook_subscriptions (project_id);

-- Append-only - one row per delivery ATTEMPT (a retried delivery logs multiple rows, one per
-- attempt, the last one carrying the terminal SUCCESS/FAILED status - see WebhookDeliveryService).
CREATE TABLE webhook_deliveries (
    id uuid NOT NULL,
    subscription_id uuid NOT NULL,
    event_type character varying(50) NOT NULL,
    status_code integer,
    status character varying(20) NOT NULL,
    attempt integer NOT NULL,
    delivered_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY webhook_deliveries ADD CONSTRAINT webhook_deliveries_pkey PRIMARY KEY (id);
ALTER TABLE ONLY webhook_deliveries ADD CONSTRAINT fk_webhook_deliveries_subscription FOREIGN KEY (subscription_id) REFERENCES webhook_subscriptions(id);

CREATE INDEX idx_webhook_deliveries_subscription ON webhook_deliveries (subscription_id, delivered_at DESC);
