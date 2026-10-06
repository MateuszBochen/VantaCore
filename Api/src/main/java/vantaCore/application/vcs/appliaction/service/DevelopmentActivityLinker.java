package vantaCore.application.vcs.appliaction.service;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.shared.application.event.EventBusInterface;
import vantaCore.application.ticket.domain.TicketAggregate;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketKey;
import vantaCore.application.vcs.domain.event.VcsBranchWasCreated;
import vantaCore.application.vcs.domain.event.VcsCommitWasPushed;
import vantaCore.application.vcs.domain.event.VcsPullRequestWasDeclined;
import vantaCore.application.vcs.domain.event.VcsPullRequestWasMerged;
import vantaCore.application.vcs.domain.event.VcsPullRequestWasOpened;
import vantaCore.application.vcs.domain.repository.DevelopmentActivityRepositoryInterface;
import vantaCore.application.vcs.domain.vo.Deployment;
import vantaCore.application.vcs.domain.vo.DeploymentStatus;
import vantaCore.application.vcs.domain.vo.DevelopmentBranch;
import vantaCore.application.vcs.domain.vo.DevelopmentCommit;
import vantaCore.application.vcs.domain.vo.DevelopmentPullRequest;
import vantaCore.application.vcs.domain.vo.PullRequestStatus;

import java.time.Instant;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/** Shared across all four provider webhook handlers - the regex-match-then-record operation is
 genuinely identical once a handler has parsed its own provider-specific JSON into these plain
 facts (see VcsWebhookHandlerInterface's javadoc for why the parsing itself stays per-provider). */
@Component
public class DevelopmentActivityLinker {

    private final TicketKeyExtractor extractor;
    private final TicketAggregateRepositoryInterface ticketRepository;
    private final DevelopmentActivityRepositoryInterface activityRepository;
    private final EventBusInterface eventBus;

    public DevelopmentActivityLinker(
        TicketKeyExtractor extractor,
        TicketAggregateRepositoryInterface ticketRepository,
        DevelopmentActivityRepositoryInterface activityRepository,
        EventBusInterface eventBus
    ) {
        this.extractor = extractor;
        this.ticketRepository = ticketRepository;
        this.activityRepository = activityRepository;
        this.eventBus = eventBus;
    }

    /** A push: matches against the branch name AND each commit's own message independently - a
     commit lands on a matched ticket if EITHER the branch it's on or its own message references
     that ticket, and either way the branch entry itself gets upserted too (see
     DevelopmentActivityAggregate.withBranch).

     Dispatches VcsCommitWasPushed once per referenced ticket that actually had a commit linked, and
     - when the provider reports the ref as newly created - VcsBranchWasCreated once per ticket the
     branch NAME references (independent of whether any commit did). */
    public void linkPush(ProjectAggregate project, String branchName, String branchUrl, boolean branchWasCreated, List<CommitFact> commits) {
        String prefix = prefixOf(project);
        Set<String> branchKeys = this.extractor.extract(branchName, prefix);
        UUID projectId = project.getId().value();

        Set<UUID> commitTicketIds = new LinkedHashSet<>();

        for (CommitFact commit : commits) {
            Set<String> matchedKeys = new HashSet<>(branchKeys);
            matchedKeys.addAll(this.extractor.extract(commit.message(), prefix));

            for (String key : matchedKeys) {
                findTicketId(project, key).ifPresent(ticketId -> {
                    this.activityRepository.update(ticketId, activity -> activity
                        .withCommit(new DevelopmentCommit(commit.sha(), commit.message(), commit.authorName(), commit.authoredAt(), commit.url()))
                        .withBranch(new DevelopmentBranch(branchName, commit.sha(), commit.authoredAt(), branchUrl))
                    );
                    commitTicketIds.add(ticketId);
                });
            }
        }

        for (UUID ticketId : commitTicketIds) {
            this.eventBus.dispatch(new VcsCommitWasPushed(projectId, ticketId, branchName));
        }

        if (branchWasCreated) {
            for (String key : branchKeys) {
                findTicketId(project, key).ifPresent(ticketId ->
                    this.eventBus.dispatch(new VcsBranchWasCreated(projectId, ticketId, branchName))
                );
            }
        }
    }

    /** PR opened/updated/merged/declined - status and title/url always win over whatever's already
     stored (the source of truth for those is always the latest PR event), approvingReviewers is
     preserved from any existing entry since this event carries no review information.

     openingEvent = this delivery is the genuine "PR opened/reopened" provider action (not a later
     update to an already-open PR); it only matters while the PR is still OPEN. Dispatches, per
     referenced ticket, VcsPullRequestWasOpened / WasMerged / WasDeclined off the resulting state -
     a plain update of an open PR dispatches nothing. */
    public void linkPullRequest(
        ProjectAggregate project, String prId, String title, String description, PullRequestStatus status, String url, boolean openingEvent
    ) {
        UUID projectId = project.getId().value();

        for (String key : matchedKeys(project, title, description)) {
            findTicketId(project, key).ifPresent(ticketId -> {
                this.activityRepository.update(ticketId, activity -> {
                    Set<String> reviewers = activity.findPullRequest(prId).map(DevelopmentPullRequest::approvingReviewers).orElse(Set.of());
                    return activity.withPullRequest(new DevelopmentPullRequest(prId, title, status, reviewers, url));
                });

                switch (status) {
                    case MERGED -> this.eventBus.dispatch(new VcsPullRequestWasMerged(projectId, ticketId, prId, title, url));
                    case DECLINED -> this.eventBus.dispatch(new VcsPullRequestWasDeclined(projectId, ticketId, prId, title, url));
                    case OPEN -> {
                        if (openingEvent) {
                            this.eventBus.dispatch(new VcsPullRequestWasOpened(projectId, ticketId, prId, title, url));
                        }
                    }
                }
            });
        }
    }

    /** One reviewer's approval state changing (GitHub pull_request_review, GitLab approval event,
     Bitbucket pullrequest:approved/unapproved) - incremental: adds or removes just that one
     reviewer from the approving set, everything else about the PR entry is preserved as-is. */
    public void linkPullRequestApproval(
        ProjectAggregate project, String prId, String title, String description, String url, String reviewerId, boolean approved
    ) {
        for (String key : matchedKeys(project, title, description)) {
            findTicketId(project, key).ifPresent(ticketId -> this.activityRepository.update(ticketId, activity -> {
                DevelopmentPullRequest existing = activity.findPullRequest(prId)
                    .orElse(new DevelopmentPullRequest(prId, title, PullRequestStatus.OPEN, Set.of(), url));

                Set<String> reviewers = new HashSet<>(existing.approvingReviewers());
                if (approved) {
                    reviewers.add(reviewerId);
                } else {
                    reviewers.remove(reviewerId);
                }

                return activity.withPullRequest(new DevelopmentPullRequest(prId, existing.title(), existing.status(), reviewers, existing.url()));
            }));
        }
    }

    /** Azure DevOps only - its reviewers[] array is the full current review state every time, so
     the whole approving set is replaced rather than incrementally adjusted (see
     AzureDevOpsWebhookHandler). */
    public void linkPullRequestApprovalSet(
        ProjectAggregate project, String prId, String title, String description, String url, Set<String> approvingReviewerIds
    ) {
        for (String key : matchedKeys(project, title, description)) {
            findTicketId(project, key).ifPresent(ticketId -> this.activityRepository.update(ticketId, activity -> {
                DevelopmentPullRequest existing = activity.findPullRequest(prId)
                    .orElse(new DevelopmentPullRequest(prId, title, PullRequestStatus.OPEN, Set.of(), url));

                return activity.withPullRequest(new DevelopmentPullRequest(prId, existing.title(), existing.status(), approvingReviewerIds, existing.url()));
            }));
        }
    }

    /** Azure DevOps only (v1) - matchText is whatever the release payload offers to regex against
     (release name / definition name / release notes), see AzureDevOpsWebhookHandler for why this
     is a best-effort inference rather than a specified contract. */
    public void linkDeployment(ProjectAggregate project, String matchText, String environment, DeploymentStatus status, Instant deployedAt) {
        for (String key : this.extractor.extract(matchText, prefixOf(project))) {
            findTicketId(project, key).ifPresent(ticketId ->
                this.activityRepository.update(ticketId, activity -> activity.withDeployment(new Deployment(environment, status, deployedAt)))
            );
        }
    }

    private Set<String> matchedKeys(ProjectAggregate project, String title, String description) {
        String prefix = prefixOf(project);
        Set<String> keys = new HashSet<>(this.extractor.extract(title, prefix));
        keys.addAll(this.extractor.extract(description, prefix));
        return keys;
    }

    private String prefixOf(ProjectAggregate project) {
        return project.getPrefix() != null ? project.getPrefix().value() : null;
    }

    private Optional<UUID> findTicketId(ProjectAggregate project, String key) {
        return this.ticketRepository.findByProjectIdAndKey(project.getId().value(), new TicketKey(key))
            .map(TicketAggregate::toSnapshot)
            .map(snapshot -> snapshot.id().value());
    }

    public record CommitFact(String sha, String message, String authorName, Instant authoredAt, String url) {
    }
}
