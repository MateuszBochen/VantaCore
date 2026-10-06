-- Append-only cross-cutting audit trail, populated by AuditLoggingMiddleware wrapping the command
-- bus (not per-handler logging calls) - see the "Audit capture via a cross-cutting interceptor" ADR
-- on the Audit Log sub-project.
CREATE TABLE audit_log_entries (
    id uuid NOT NULL,
    project_id uuid NOT NULL,
    resource_type varchar(50) NOT NULL,
    resource_id uuid NOT NULL,
    action varchar(20) NOT NULL,
    actor_id uuid,
    actor_email character varying(255),
    occurred_at timestamp(6) with time zone NOT NULL,
    diff jsonb NOT NULL
);

ALTER TABLE ONLY audit_log_entries ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);
ALTER TABLE ONLY audit_log_entries ADD CONSTRAINT fk_audit_log_entries_project FOREIGN KEY (project_id) REFERENCES projects(id);

CREATE INDEX idx_audit_log_entries_project_occurred ON audit_log_entries (project_id, occurred_at DESC);
CREATE INDEX idx_audit_log_entries_resource ON audit_log_entries (resource_type, resource_id);
