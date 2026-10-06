package vantaCore.application.automationEngine.domain.vo;

public enum TriggerType {
    TICKET_CREATED,
    TICKET_STATUS_CHANGED,
    TICKET_FIELD_CHANGED,
    COMMENT_ADDED,
    // Git/VCS triggers - fired off the inbound provider webhook the VCS integration ingests, once
    // per ticket the commit/branch/PR references (same ticket-key linkage the rest of that feature
    // uses). No trigger params - see AutomationRuleEngine's triggerParamsMatch. MERGED/DECLINED
    // deliberately mirror vcs.domain.vo.PullRequestStatus's own names.
    COMMIT_PUSHED,
    BRANCH_CREATED,
    PULL_REQUEST_OPENED,
    PULL_REQUEST_MERGED,
    PULL_REQUEST_DECLINED
}
