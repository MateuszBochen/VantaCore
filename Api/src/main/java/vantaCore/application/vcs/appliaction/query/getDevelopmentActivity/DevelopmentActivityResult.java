package vantaCore.application.vcs.appliaction.query.getDevelopmentActivity;

import vantaCore.application.vcs.domain.vo.Deployment;
import vantaCore.application.vcs.domain.vo.DevelopmentBranch;
import vantaCore.application.vcs.domain.vo.DevelopmentCommit;

import java.util.Set;
import java.util.UUID;

/** branches/commits/deployments reuse the domain records directly - they're already exactly
 wire-shaped with nothing internal to hide, same precedent as AuditLogEntryResult reusing FieldDiff.
 pullRequests gets its own Result type since approvalsCount is derived from an internal
 approvingReviewers set that isn't part of the wire contract (see DevelopmentPullRequest). */
public record DevelopmentActivityResult(
    UUID ticketId,
    Set<DevelopmentBranch> branches,
    Set<DevelopmentCommit> commits,
    Set<DevelopmentPullRequestResult> pullRequests,
    Set<Deployment> deployments
) {
}
