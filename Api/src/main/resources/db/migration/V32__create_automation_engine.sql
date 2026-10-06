-- Automation Engine (trigger/condition/action rules) - distinct from the older, narrower
-- project_automation_rules (parent-status-sync only, V1__baseline.sql) which stays as-is; this is
-- a genuinely separate, richer engine, not a replacement migration for that table.
CREATE TABLE automation_engine_rules (
    id uuid NOT NULL,
    project_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    enabled boolean NOT NULL DEFAULT true,
    -- Denormalized from trigger->>'type' purely so the execution engine's hot-path lookup
    -- (findAllEnabledByProjectIdAndTriggerType) can filter with a plain indexed column instead of a
    -- jsonb path expression.
    trigger_type character varying(32) NOT NULL,
    trigger jsonb NOT NULL,
    conditions jsonb NOT NULL,
    actions jsonb NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY automation_engine_rules ADD CONSTRAINT automation_engine_rules_pkey PRIMARY KEY (id);
ALTER TABLE ONLY automation_engine_rules ADD CONSTRAINT fk_automation_engine_rules_project FOREIGN KEY (project_id) REFERENCES projects(id);
CREATE INDEX idx_automation_engine_rules_project_trigger ON automation_engine_rules (project_id, enabled, trigger_type);

-- Execution history (GET .../automation-rule/{id}/executions) - designed in now even though the
-- frontend doesn't consume it yet, so it doesn't need a follow-up migration later. Deliberately no
-- FK to automation_engine_rules(id): a deleted rule's execution history should still be
-- inspectable/auditable, not cascade-deleted or block the rule's own deletion.
CREATE TABLE automation_rule_executions (
    id uuid NOT NULL,
    rule_id uuid NOT NULL,
    project_id uuid NOT NULL,
    -- The ticket this run evaluated against - null would only happen for a trigger type with no
    -- ticket involved, which none of today's 4 trigger types are (COMMENT_ADDED still resolves to
    -- the comment's owning ticket), but the column stays nullable for a possible future trigger
    -- type that isn't ticket-scoped at all.
    ticket_id uuid,
    trigger_type character varying(32) NOT NULL,
    -- MATCHED (conditions passed, actions ran - may still be PARTIAL_FAILURE per executed_actions),
    -- SKIPPED (conditions didn't match), MAX_DEPTH_EXCEEDED (loop-protection stopped it), FAILED
    -- (an unexpected error, not a per-action failure - see executed_actions for those).
    status character varying(32) NOT NULL,
    -- One entry per action attempted: [{"actionId","type","success","error"}, ...] - lets a rule
    -- with e.g. 3 actions show "2 succeeded, 1 failed" rather than collapsing to one boolean.
    executed_actions jsonb NOT NULL,
    error_message text,
    -- Event-chain depth this execution ran at (0 = a genuine user action triggered it directly, not
    -- another rule's action) - see AutomationExecutionContext. Surfaced for debugging runaway/looping
    -- rule chains, not just enforced silently.
    depth integer NOT NULL,
    executed_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY automation_rule_executions ADD CONSTRAINT automation_rule_executions_pkey PRIMARY KEY (id);
CREATE INDEX idx_automation_rule_executions_rule_id ON automation_rule_executions (rule_id, executed_at DESC);
