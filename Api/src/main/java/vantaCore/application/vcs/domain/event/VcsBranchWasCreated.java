package vantaCore.application.vcs.domain.event;

import java.util.UUID;

/** A branch whose name references {@code ticketId} was created (first push to a ref the provider
 reports as new). Fired once per ticket the branch name references. */
public record VcsBranchWasCreated(UUID projectId, UUID ticketId, String branchName) {
}
