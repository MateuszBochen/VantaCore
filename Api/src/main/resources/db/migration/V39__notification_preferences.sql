-- Notification Tuning - see the "enforced at creation time, not filtered client-side" ADR.

-- DIGEST-mode notifications are still created immediately (so GET /api/notification already shows
-- them - no new filtering needed there), just not pushed over WebSocket right away; this flag is
-- how the scheduled flush job (NotificationDigestFlushJob) finds what it still owes a batched push.
ALTER TABLE notifications ADD COLUMN pending_digest boolean NOT NULL DEFAULT false;

-- project_id/event_type stay genuinely nullable (null = "applies to all projects"/"all event
-- types" - these are overrides, not a whitelist, per the sub-project's own data model) rather than
-- using a sentinel value, so a real FK on project_id is still possible. Postgres's normal unique-
-- constraint semantics treat every NULL as distinct, which would otherwise let the same user
-- accumulate multiple rows all meaning "all projects, all event types" - the COALESCE-expression
-- index below is what makes NULL behave as one comparable "wildcard" value instead, per user.
CREATE TABLE notification_preferences (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    project_id uuid,
    event_type character varying(50),
    mode character varying(20) NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY notification_preferences ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);
ALTER TABLE ONLY notification_preferences ADD CONSTRAINT fk_notification_preferences_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE ONLY notification_preferences ADD CONSTRAINT fk_notification_preferences_project FOREIGN KEY (project_id) REFERENCES projects(id);

CREATE UNIQUE INDEX uk_notification_preferences_user_project_event
    ON notification_preferences (user_id, COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(event_type, '__ALL__'));
