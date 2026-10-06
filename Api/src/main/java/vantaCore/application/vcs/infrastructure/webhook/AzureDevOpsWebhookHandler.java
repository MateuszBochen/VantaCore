package vantaCore.application.vcs.infrastructure.webhook;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.vcs.appliaction.service.DevelopmentActivityLinker;
import vantaCore.application.vcs.appliaction.service.DevelopmentActivityLinker.CommitFact;
import vantaCore.application.vcs.domain.vo.DeploymentStatus;
import vantaCore.application.vcs.domain.vo.PullRequestStatus;
import vantaCore.application.vcs.domain.vo.VcsProvider;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Azure DevOps Service Hooks put the event type in the payload body itself (`eventType`), not a
 header, unlike the other three providers. Configured event types: git.push,
 git.pullrequest.created/updated.

 Deployment status handling (`ms.vss-release.deployment-completed-event`) is this handler's one
 genuinely inferred piece - neither the feature brief nor this sub-project's own Solution Design
 named a specific event/payload shape for it, only that deployments are in scope for Azure DevOps.
 The shape below matches Azure DevOps' real Release Management webhook payload as documented, but
 has NOT been verified against a live delivery - flagged for validation once a real Azure DevOps
 connection is available to test against. It also has no branch/commit/PR text to regex a ticket key
 out of by nature (a release deploys a build, not a single ref) - this reads the release name/
 definition name/release notes as the best available text to match against, which may need
 revisiting once real payloads are seen. */
@Component
public class AzureDevOpsWebhookHandler implements VcsWebhookHandlerInterface {

    private static final String DEPLOYMENT_EVENT = "ms.vss-release.deployment-completed-event";
    private static final String NULL_OBJECT_ID = "0000000000000000000000000000000000000000";

    private final DevelopmentActivityLinker linker;

    public AzureDevOpsWebhookHandler(DevelopmentActivityLinker linker) {
        this.linker = linker;
    }

    @Override
    public VcsProvider provider() {
        return VcsProvider.AZURE_DEVOPS;
    }

    @Override
    public void handle(ProjectAggregate project, Map<String, String> headers, JsonNode payload) {
        String eventType = text(payload.path("eventType"));
        if (eventType == null) {
            return;
        }

        switch (eventType) {
            case "git.push" -> handlePush(project, payload);
            case "git.pullrequest.created" -> handlePullRequest(project, payload, true);
            case "git.pullrequest.updated" -> handlePullRequest(project, payload, false);
            case DEPLOYMENT_EVENT -> handleDeployment(project, payload);
            default -> {
                // not an event this feature acts on
            }
        }
    }

    private void handlePush(ProjectAggregate project, JsonNode payload) {
        JsonNode resource = payload.path("resource");
        JsonNode firstRefUpdate = resource.path("refUpdates").isArray() && resource.path("refUpdates").size() > 0
            ? resource.path("refUpdates").get(0) : null;

        if (firstRefUpdate == null) {
            return;
        }

        String ref = text(firstRefUpdate.path("name"));
        if (ref == null || !ref.startsWith("refs/heads/")) {
            return;
        }

        String branchName = ref.substring("refs/heads/".length());
        boolean branchCreated = NULL_OBJECT_ID.equals(text(firstRefUpdate.path("oldObjectId")));
        String repoWebUrl = text(resource.path("repository").path("webUrl"));
        if (repoWebUrl == null) {
            repoWebUrl = text(resource.path("repository").path("remoteUrl"));
        }
        String branchUrl = repoWebUrl != null ? repoWebUrl + "?version=GB" + branchName : null;

        List<CommitFact> commits = new ArrayList<>();
        for (JsonNode commit : resource.path("commits")) {
            String commitId = text(commit.path("commitId"));
            commits.add(new CommitFact(
                commitId,
                text(commit.path("comment")),
                text(commit.path("author").path("name")),
                parseInstant(text(commit.path("author").path("date"))),
                repoWebUrl != null && commitId != null ? repoWebUrl + "/commit/" + commitId : text(commit.path("url"))
            ));
        }

        this.linker.linkPush(project, branchName, branchUrl, branchCreated, commits);
    }

    private void handlePullRequest(ProjectAggregate project, JsonNode payload, boolean openingEvent) {
        JsonNode resource = payload.path("resource");
        String id = text(resource.path("pullRequestId"));
        String title = text(resource.path("title"));
        String description = text(resource.path("description"));
        PullRequestStatus status = toStatus(text(resource.path("status")));

        String repoWebUrl = text(resource.path("repository").path("webUrl"));
        String url = repoWebUrl != null && id != null ? repoWebUrl + "/pullrequest/" + id : null;

        this.linker.linkPullRequest(project, id, title, description, status, url, openingEvent);

        // Full reviewer list every time (unlike GitHub/GitLab/Bitbucket's one-reviewer-per-event
        // shape) - vote > 0 covers both "approved" (10) and "approved with suggestions" (5).
        Set<String> approvingReviewers = new HashSet<>();
        for (JsonNode reviewer : resource.path("reviewers")) {
            if (reviewer.path("vote").asInt(0) > 0) {
                String name = text(reviewer.path("displayName"));
                if (name != null) {
                    approvingReviewers.add(name);
                }
            }
        }

        this.linker.linkPullRequestApprovalSet(project, id, title, description, url, approvingReviewers);
    }

    private void handleDeployment(ProjectAggregate project, JsonNode payload) {
        JsonNode deployment = payload.path("resource").path("deployment");
        JsonNode release = deployment.path("release");

        String environment = text(deployment.path("releaseEnvironment").path("name"));
        DeploymentStatus status = toDeploymentStatus(text(deployment.path("deploymentStatus")));
        Instant deployedAt = parseInstant(text(deployment.path("completedOn")));

        String matchText = String.join(" ",
            nullToEmpty(text(release.path("name"))),
            nullToEmpty(text(release.path("releaseDefinition").path("name"))),
            nullToEmpty(text(deployment.path("comment")))
        );

        if (environment == null) {
            return;
        }

        this.linker.linkDeployment(project, matchText, environment, status, deployedAt);
    }

    private PullRequestStatus toStatus(String status) {
        if ("completed".equals(status)) {
            return PullRequestStatus.MERGED;
        }
        if ("abandoned".equals(status)) {
            return PullRequestStatus.DECLINED;
        }
        return PullRequestStatus.OPEN;
    }

    private DeploymentStatus toDeploymentStatus(String status) {
        if (status == null) {
            return DeploymentStatus.IN_PROGRESS;
        }
        return switch (status.toLowerCase()) {
            case "succeeded" -> DeploymentStatus.SUCCEEDED;
            case "failed", "partiallysucceeded" -> DeploymentStatus.FAILED;
            default -> DeploymentStatus.IN_PROGRESS;
        };
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private Instant parseInstant(String value) {
        if (value == null) {
            return null;
        }
        try {
            return Instant.parse(value);
        } catch (DateTimeParseException exception) {
            return null;
        }
    }

    private String text(JsonNode node) {
        return node == null || node.isMissingNode() || node.isNull() ? null : node.asText();
    }
}
