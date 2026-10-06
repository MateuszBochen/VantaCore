package vantaCore.application.vcs.domain.event;

import java.util.UUID;

/** A pull/merge request referencing {@code ticketId} reached the DECLINED (rejected/closed-unmerged)
 terminal state. */
public record VcsPullRequestWasDeclined(UUID projectId, UUID ticketId, String pullRequestId, String title, String url) {
}
