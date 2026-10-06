package vantaCore.application.vcs.domain.vo;

import java.util.Set;

/** approvingReviewers is the actual tracked state (a set of reviewer identifiers currently in an
 "approved" state), not a raw counter - approvalsCount() is derived from it. A set survives
 duplicate/out-of-order webhook deliveries correctly (the same reviewer approving twice is still one
 entry) in a way a plain increment/decrement counter wouldn't - see the "approvals via webhook
 events" ADR for why this can't just be pulled from one API call. Only the derived count is ever
 exposed on the wire (see DevelopmentPullRequestResult) - the reviewer identities themselves aren't
 part of this app's data model beyond counting them. */
public record DevelopmentPullRequest(
    String id,
    String title,
    PullRequestStatus status,
    Set<String> approvingReviewers,
    String url
) {
    public DevelopmentPullRequest {
        approvingReviewers = approvingReviewers == null ? Set.of() : Set.copyOf(approvingReviewers);
    }

    public int approvalsCount() {
        return approvingReviewers.size();
    }
}
