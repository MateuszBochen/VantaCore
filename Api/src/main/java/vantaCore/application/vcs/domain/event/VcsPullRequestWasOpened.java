package vantaCore.application.vcs.domain.event;

import java.util.UUID;

/** A pull/merge request referencing {@code ticketId} (via its title or description) was opened.
 Fires only on the genuine "opened"/"reopened" provider action, not on every subsequent update to
 an already-open PR. */
public record VcsPullRequestWasOpened(UUID projectId, UUID ticketId, String pullRequestId, String title, String url) {
}
