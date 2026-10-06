package vantaCore.application.vcs.infrastructure.webhook;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.vcs.appliaction.service.DevelopmentActivityLinker;
import vantaCore.application.vcs.appliaction.service.DevelopmentActivityLinker.CommitFact;
import vantaCore.application.vcs.domain.vo.PullRequestStatus;
import vantaCore.application.vcs.domain.vo.VcsProvider;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** Event type comes from the X-Event-Key header. Configured event types: repo:push,
 pullrequest:created/updated/fulfilled/rejected, pullrequest:approved/unapproved. Bitbucket's state
 values (OPEN/MERGED/DECLINED) already match PullRequestStatus's own names 1:1. */
@Component
public class BitbucketWebhookHandler implements VcsWebhookHandlerInterface {

    private static final String EVENT_HEADER = "x-event-key";

    private final DevelopmentActivityLinker linker;

    public BitbucketWebhookHandler(DevelopmentActivityLinker linker) {
        this.linker = linker;
    }

    @Override
    public VcsProvider provider() {
        return VcsProvider.BITBUCKET;
    }

    @Override
    public void handle(ProjectAggregate project, Map<String, String> headers, JsonNode payload) {
        String event = headers.get(EVENT_HEADER);
        if (event == null) {
            return;
        }

        switch (event) {
            case "repo:push" -> handlePush(project, payload);
            case "pullrequest:created" -> handlePullRequest(project, payload, true);
            case "pullrequest:updated", "pullrequest:fulfilled", "pullrequest:rejected" -> handlePullRequest(project, payload, false);
            case "pullrequest:approved" -> handleApproval(project, payload, true);
            case "pullrequest:unapproved" -> handleApproval(project, payload, false);
            default -> {
                // not an event this feature acts on
            }
        }
    }

    private void handlePush(ProjectAggregate project, JsonNode payload) {
        for (JsonNode change : payload.path("push").path("changes")) {
            JsonNode newRef = change.path("new");
            String branchName = text(newRef.path("name"));
            if (branchName == null) {
                continue;
            }

            String branchUrl = text(newRef.path("target").path("links").path("html").path("href"));
            // Bitbucket sends `old: null` for a change that creates the ref.
            boolean branchCreated = change.path("old").isNull() || change.path("old").isMissingNode();

            List<CommitFact> commits = new ArrayList<>();
            for (JsonNode commit : change.path("commits")) {
                commits.add(new CommitFact(
                    text(commit.path("hash")),
                    text(commit.path("message")),
                    text(commit.path("author").path("user").path("display_name")),
                    parseInstant(text(commit.path("date"))),
                    text(commit.path("links").path("html").path("href"))
                ));
            }

            this.linker.linkPush(project, branchName, branchUrl, branchCreated, commits);
        }
    }

    private void handlePullRequest(ProjectAggregate project, JsonNode payload, boolean openingEvent) {
        JsonNode pullRequest = payload.path("pullrequest");
        String id = text(pullRequest.path("id"));
        String title = text(pullRequest.path("title"));
        String description = text(pullRequest.path("description"));
        String url = text(pullRequest.path("links").path("html").path("href"));
        PullRequestStatus status = toStatus(text(pullRequest.path("state")));

        this.linker.linkPullRequest(project, id, title, description, status, url, openingEvent);
    }

    private void handleApproval(ProjectAggregate project, JsonNode payload, boolean approved) {
        JsonNode pullRequest = payload.path("pullrequest");
        String id = text(pullRequest.path("id"));
        String title = text(pullRequest.path("title"));
        String description = text(pullRequest.path("description"));
        String url = text(pullRequest.path("links").path("html").path("href"));

        String reviewer = text(payload.path("approval").path("user").path("uuid"));
        if (reviewer == null) {
            reviewer = text(payload.path("approval").path("user").path("display_name"));
        }

        if (id == null || reviewer == null) {
            return;
        }

        this.linker.linkPullRequestApproval(project, id, title, description, url, reviewer, approved);
    }

    private PullRequestStatus toStatus(String state) {
        if (state == null) {
            return PullRequestStatus.OPEN;
        }
        try {
            return PullRequestStatus.valueOf(state);
        } catch (IllegalArgumentException exception) {
            return PullRequestStatus.OPEN;
        }
    }

    private Instant parseInstant(String value) {
        if (value == null) {
            return null;
        }
        try {
            return OffsetDateTime.parse(value).toInstant();
        } catch (DateTimeParseException exception) {
            return null;
        }
    }

    private String text(JsonNode node) {
        return node == null || node.isMissingNode() || node.isNull() ? null : node.asText();
    }
}
