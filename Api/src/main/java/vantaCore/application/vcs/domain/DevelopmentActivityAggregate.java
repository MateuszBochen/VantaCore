package vantaCore.application.vcs.domain;

import vantaCore.application.vcs.domain.vo.Deployment;
import vantaCore.application.vcs.domain.vo.DevelopmentBranch;
import vantaCore.application.vcs.domain.vo.DevelopmentCommit;
import vantaCore.application.vcs.domain.vo.DevelopmentPullRequest;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/** Every mutator is an upsert keyed by the entry's own natural key (branch name / commit sha / PR
 id / deployment environment) - webhook deliveries are "here's the latest state of X", not a log to
 append to verbatim, except commits which genuinely do accumulate (deduped by sha). See
 JpaDevelopmentActivityRepositoryAdapter.update for how concurrent webhook deliveries for the same
 ticket are serialized around this read-modify-write shape. */
public class DevelopmentActivityAggregate {
    private final UUID ticketId;
    private final Set<DevelopmentBranch> branches;
    private final Set<DevelopmentCommit> commits;
    private final Set<DevelopmentPullRequest> pullRequests;
    private final Set<Deployment> deployments;

    private DevelopmentActivityAggregate(
        UUID ticketId,
        Set<DevelopmentBranch> branches,
        Set<DevelopmentCommit> commits,
        Set<DevelopmentPullRequest> pullRequests,
        Set<Deployment> deployments
    ) {
        this.ticketId = ticketId;
        this.branches = branches;
        this.commits = commits;
        this.pullRequests = pullRequests;
        this.deployments = deployments;
    }

    public static DevelopmentActivityAggregate empty(UUID ticketId) {
        return new DevelopmentActivityAggregate(ticketId, Set.of(), Set.of(), Set.of(), Set.of());
    }

    public static DevelopmentActivityAggregate fromSnapshot(DevelopmentActivitySnapshot snapshot) {
        return new DevelopmentActivityAggregate(
            snapshot.ticketId(), snapshot.branches(), snapshot.commits(), snapshot.pullRequests(), snapshot.deployments()
        );
    }

    public DevelopmentActivityAggregate withBranch(DevelopmentBranch branch) {
        Map<String, DevelopmentBranch> byName = new LinkedHashMap<>();
        for (DevelopmentBranch existing : this.branches) {
            byName.put(existing.name(), existing);
        }
        byName.put(branch.name(), branch);

        return new DevelopmentActivityAggregate(ticketId, Set.copyOf(byName.values()), commits, pullRequests, deployments);
    }

    public DevelopmentActivityAggregate withCommit(DevelopmentCommit commit) {
        if (this.commits.stream().anyMatch(existing -> existing.sha().equals(commit.sha()))) {
            return this;
        }

        Set<DevelopmentCommit> updated = new LinkedHashSet<>(this.commits);
        updated.add(commit);

        return new DevelopmentActivityAggregate(ticketId, branches, Set.copyOf(updated), pullRequests, deployments);
    }

    public DevelopmentActivityAggregate withPullRequest(DevelopmentPullRequest pullRequest) {
        Map<String, DevelopmentPullRequest> byId = new LinkedHashMap<>();
        for (DevelopmentPullRequest existing : this.pullRequests) {
            byId.put(existing.id(), existing);
        }
        byId.put(pullRequest.id(), pullRequest);

        return new DevelopmentActivityAggregate(ticketId, branches, commits, Set.copyOf(byId.values()), deployments);
    }

    public Optional<DevelopmentPullRequest> findPullRequest(String id) {
        return this.pullRequests.stream().filter(pr -> pr.id().equals(id)).findFirst();
    }

    public DevelopmentActivityAggregate withDeployment(Deployment deployment) {
        Map<String, Deployment> byEnvironment = new LinkedHashMap<>();
        for (Deployment existing : this.deployments) {
            byEnvironment.put(existing.environment(), existing);
        }
        byEnvironment.put(deployment.environment(), deployment);

        return new DevelopmentActivityAggregate(ticketId, branches, commits, pullRequests, Set.copyOf(byEnvironment.values()));
    }

    public DevelopmentActivitySnapshot toSnapshot() {
        return new DevelopmentActivitySnapshot(ticketId, branches, commits, pullRequests, deployments);
    }
}
