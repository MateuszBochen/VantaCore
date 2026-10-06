package vantaCore.application.vcs.infrastructure.webhook;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.vcs.appliaction.service.DevelopmentActivityLinker;
import vantaCore.application.vcs.appliaction.service.DevelopmentActivityLinker.CommitFact;
import vantaCore.application.vcs.domain.vo.PullRequestStatus;
import vantaCore.application.vcs.domain.vo.VcsProvider;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** Event type comes from the X-GitHub-Event header, not the payload body. Configured event types:
 push, pull_request, pull_request_review (see the "approvals via webhook events" ADR). */
@Component
public class GitHubWebhookHandler implements VcsWebhookHandlerInterface {

    private static final String EVENT_HEADER = "x-github-event";

    private final DevelopmentActivityLinker linker;

    public GitHubWebhookHandler(DevelopmentActivityLinker linker) {
        this.linker = linker;
    }

    @Override
    public VcsProvider provider() {
        return VcsProvider.GITHUB;
    }

    @Override
    public void handle(ProjectAggregate project, Map<String, String> headers, JsonNode payload) {
        String event = headers.get(EVENT_HEADER);
        if (event == null) {
            return;
        }

        switch (event) {
            case "push" -> handlePush(project, payload);
            case "pull_request" -> handlePullRequest(project, payload);
            case "pull_request_review" -> handlePullRequestReview(project, payload);
            default -> {
                // not an event this feature acts on - no-op, not an error
            }
        }
    }

    private void handlePush(ProjectAggregate project, JsonNode payload) {
        String ref = text(payload.path("ref"));
        if (ref == null || !ref.startsWith("refs/heads/")) {
            return;
        }

        String branchName = ref.substring("refs/heads/".length());
        String repoHtmlUrl = text(payload.path("repository").path("html_url"));
        String branchUrl = repoHtmlUrl != null ? repoHtmlUrl + "/tree/" + branchName : null;
        boolean branchCreated = payload.path("created").asBoolean(false);

        List<CommitFact> commits = new ArrayList<>();
        for (JsonNode commit : payload.path("commits")) {
            commits.add(new CommitFact(
                text(commit.path("id")),
                text(commit.path("message")),
                text(commit.path("author").path("name")),
                parseInstant(text(commit.path("timestamp"))),
                text(commit.path("url"))
            ));
        }

        this.linker.linkPush(project, branchName, branchUrl, branchCreated, commits);
    }

    private void handlePullRequest(ProjectAggregate project, JsonNode payload) {
        JsonNode pullRequest = payload.path("pull_request");
        String id = text(pullRequest.path("number"));
        String title = text(pullRequest.path("title"));
        String description = text(pullRequest.path("body"));
        String url = text(pullRequest.path("html_url"));
        PullRequestStatus status = toStatus(pullRequest);

        String action = text(payload.path("action"));
        boolean openingEvent = "opened".equals(action) || "reopened".equals(action);

        this.linker.linkPullRequest(project, id, title, description, status, url, openingEvent);
    }

    private void handlePullRequestReview(ProjectAggregate project, JsonNode payload) {
        JsonNode pullRequest = payload.path("pull_request");
        String id = text(pullRequest.path("number"));
        String title = text(pullRequest.path("title"));
        String description = text(pullRequest.path("body"));
        String url = text(pullRequest.path("html_url"));

        String action = text(payload.path("action"));
        String reviewState = text(payload.path("review").path("state"));
        String reviewer = text(payload.path("review").path("user").path("login"));

        boolean approved = "approved".equals(reviewState) && !"dismissed".equals(action);

        if (reviewer == null || id == null) {
            return;
        }

        this.linker.linkPullRequestApproval(project, id, title, description, url, reviewer, approved);
    }

    private PullRequestStatus toStatus(JsonNode pullRequest) {
        boolean merged = pullRequest.path("merged").asBoolean(false);
        String state = text(pullRequest.path("state"));

        if (merged) {
            return PullRequestStatus.MERGED;
        }
        if ("closed".equals(state)) {
            return PullRequestStatus.DECLINED;
        }
        return PullRequestStatus.OPEN;
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
