package vantaCore.application.shared.domain.accessControl;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;

/**
 * The fixed catalog of assignable permission codes. New entries are added here as new
 * features need authorization - resources are defined in code, never user-created; only
 * their assignment to a role is dynamic.
 */
public enum Resource {
    ROLE_CREATE("role:create"),
    ROLE_UPDATE("role:update"),
    ROLE_DELETE("role:delete"),
    ROLE_VIEW("role:view"),

    USER_CREATE("user:create"),
    USER_UPDATE("user:update"),
    USER_VIEW("user:view"),
    USER_ASSIGN_ROLES("user:assign-roles"),

    PROJECT_MANAGE("project:manage"),
    PROJECT_VIEW("project:view"),

    // SubProject upsert covers both create and update - the handler doesn't distinguish them,
    // so neither does the permission.
    SUBPROJECT_MANAGE("subproject:manage"),
    SUBPROJECT_DEPLOY("subproject:deploy"),
    SUBPROJECT_VIEW("subproject:view"),

    TICKET_MANAGE("ticket:manage"),
    TICKET_VIEW("ticket:view"),
    // Separate from TICKET_MANAGE (create+update) - matches the sibling *_DELETE convention already
    // used for comment/worklog/testcase, unlike TICKET_MANAGE which predates delete existing at all.
    TICKET_DELETE("ticket:delete"),

    BOARD_CREATE("board:create"),
    BOARD_UPDATE("board:update"),
    BOARD_VIEW("board:view"),

    SPRINT_MANAGE("sprint:manage"),
    SPRINT_START("sprint:start"),
    SPRINT_CLOSE("sprint:close"),
    SPRINT_VIEW("sprint:view"),

    COMMENT_CREATE("comment:create"),
    COMMENT_UPDATE("comment:update"),
    COMMENT_DELETE("comment:delete"),
    COMMENT_VIEW("comment:view"),

    WORKLOG_LOG("worklog:log"),
    WORKLOG_START("worklog:start"),
    WORKLOG_UPDATE("worklog:update"),
    WORKLOG_DELETE("worklog:delete"),
    WORKLOG_VIEW("worklog:view"),

    TESTCASE_MANAGE("testcase:manage"),
    TESTCASE_DELETE("testcase:delete"),
    TESTCASE_VIEW("testcase:view"),

    // Platform documentation, incl. its attachments - there's no separate "project docs" module,
    // that content lives on the SubProject aggregate and is covered by SUBPROJECT_MANAGE/_VIEW.
    DOCUMENTATION_UPDATE("documentation:update"),
    DOCUMENTATION_VIEW("documentation:view"),

    // Release planning - single upsert covers create+update, same reasoning as SUBPROJECT_MANAGE.
    RELEASE_MANAGE("release:manage"),
    RELEASE_VIEW("release:view"),

    // Automation Engine (trigger/condition/action rules) - distinct from the older
    // project_automation_rules (parent-status-sync only, covered by PROJECT_MANAGE since it's part
    // of project settings). Single upsert covers create+update, same reasoning as RELEASE_MANAGE.
    AUTOMATION_RULE_MANAGE("automation-rule:manage"),
    AUTOMATION_RULE_VIEW("automation-rule:view"),

    // Audit Log - its own permission rather than reusing PROJECT_VIEW, since who can read the audit
    // trail is a separate concern from who can read the project itself.
    AUDIT_LOG_VIEW("audit-log:view"),

    // Import / Export - IMPORT_MANAGE covers connecting a source, previewing it, and starting a job
    // (all admin-ish, mutating or credential-touching); IMPORT_VIEW is just polling a job's
    // status/report. Export is read-only ticket data extraction, its own permission rather than
    // reusing TICKET_VIEW since "can view tickets in the UI" and "can bulk-download every ticket
    // plus every attachment as a file" are different risk levels.
    IMPORT_MANAGE("import:manage"),
    IMPORT_VIEW("import:view"),
    EXPORT_VIEW("export:view"),

    // Git / VCS Integration - connection setup is project-settings-level (its own manage/view pair,
    // matching every other integration); the per-ticket Development panel gets its own view
    // permission too, same sibling convention as comment:view/worklog:view/testcase:view rather than
    // piggybacking on ticket:view.
    VCS_CONNECTION_MANAGE("vcs-connection:manage"),
    VCS_CONNECTION_VIEW("vcs-connection:view"),
    DEVELOPMENT_VIEW("development:view"),

    // Integrations & Webhooks - WEBHOOK_MANAGE covers create/update/delete/secret-regeneration/test
    // (all admin-ish/credential-touching); WEBHOOK_VIEW covers listing subscriptions and reading the
    // delivery log, same manage/view split as every other integration in this app.
    WEBHOOK_MANAGE("webhook:manage"),
    WEBHOOK_VIEW("webhook:view"),

    // Platform-wide SSO provider configuration (GET/PUT /api/settings/sso) - not project-scoped.
    // Same manage/view split as the integrations above; MANAGE touches client secrets.
    SSO_MANAGE("sso:manage"),
    SSO_VIEW("sso:view");

    // Deliberately NOT resources (see the module survey for why):
    // - notification:* (CreateNotificationCommand is an internal event-reaction; list/mark-as-read
    //   are self-scoped to the caller via CurrentUserProviderInterface)
    // - user avatar upload / editor image upload (self-scoped / cross-cutting, not tied to one
    //   target the caller doesn't already control)
    // - ticket:propagate-estimate, ticket:propagate-time-spent (internal self/event-dispatched
    //   commands, never reachable directly from a controller)
    // - user-settings:* (GET/PUT /api/user-settings - self-scoped to the caller via
    //   CurrentUserProviderInterface, an opaque per-user preferences blob nobody else can reach)
    // - roadmap:* (GET /api/roadmap-entry - reuses RELEASE_VIEW rather than its own resource; it's
    //   just a cross-project read view over Version Tracker's own releases, nothing new to gate)

    private final String code;

    Resource(String code) {
        this.code = code;
    }

    // The code (e.g. "role:create") is the wire identifier everywhere Resource is (de)serialized -
    // it's what the resource catalog (GET /api/role/resource) hands the frontend, so round-tripping
    // it back in a role's resource set must accept the same string, not the enum constant name.
    @JsonValue
    public String getCode() {
        return code;
    }

    @JsonCreator
    public static Resource fromCode(String code) {
        return Arrays.stream(values())
            .filter(resource -> resource.code.equals(code))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Unknown resource code: " + code));
    }
}
