package vantaCore.application.vcs.domain.event;

import java.util.UUID;

/** One or more commits referencing {@code ticketId} (via the branch name or a commit message) were
 pushed. Fired once per referenced ticket per push, regardless of how many of that push's commits
 matched - not once per commit. A push that references no ticket key fires nothing (the whole VCS
 integration is ticket-linkage-scoped). */
public record VcsCommitWasPushed(UUID projectId, UUID ticketId, String branchName) {
}
