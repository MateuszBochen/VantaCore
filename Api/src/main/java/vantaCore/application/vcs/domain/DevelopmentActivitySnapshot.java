package vantaCore.application.vcs.domain;

import vantaCore.application.vcs.domain.vo.Deployment;
import vantaCore.application.vcs.domain.vo.DevelopmentBranch;
import vantaCore.application.vcs.domain.vo.DevelopmentCommit;
import vantaCore.application.vcs.domain.vo.DevelopmentPullRequest;

import java.util.Set;
import java.util.UUID;

public record DevelopmentActivitySnapshot(
    UUID ticketId,
    Set<DevelopmentBranch> branches,
    Set<DevelopmentCommit> commits,
    Set<DevelopmentPullRequest> pullRequests,
    Set<Deployment> deployments
) {
}
