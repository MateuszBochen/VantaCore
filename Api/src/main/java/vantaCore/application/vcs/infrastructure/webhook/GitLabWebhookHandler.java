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

/** Event type comes from the X-Gitlab-Event header. Configured event types: Push Hook, Merge
 Request Hook, and GitLab's merge-request-approval webhook - the least standardized of the four
 across GitLab editions/versions (self-managed EE vs. GitLab.com plans expose slightly different
 payload shapes for approvals), so the approval branch here reads defensively from either
 `merge_request` or `object_attributes`, whichever the delivery actually has. */
@Component
public class GitLabWebhookHandler implements VcsWebhookHandlerInterface {

    private static final String EVENT_HEADER = "x-gitlab-event";
    private static final String NULL_SHA = "0000000000000000000000000000000000000000";

    private final DevelopmentActivityLinker linker;

    public GitLabWebhookHandler(DevelopmentActivityLinker linker) {
        this.linker = linker;
    }

    @Override
    public VcsProvider provider() {
        return VcsProvider.GITLAB;
    }

    @Override
    public void handle(ProjectAggregate project, Map<String, String> headers, JsonNode payload) {
        String event = headers.get(EVENT_HEADER);
        if (event == null) {
            return;
        }

        if ("Push Hook".equals(event)) {
            handlePush(project, payload);
        } else if ("Merge Request Hook".equals(event)) {
            handleMergeRequest(project, payload);
        } else if (event.toLowerCase().contains("approval")) {
            handleApproval(project, payload);
        }
    }

    private void handlePush(ProjectAggregate project, JsonNode payload) {
        String ref = text(payload.path("ref"));
        if (ref == null || !ref.startsWith("refs/heads/")) {
            return;
        }

        String branchName = ref.substring("refs/heads/".length());
        String projectWebUrl = text(payload.path("project").path("web_url"));
        String branchUrl = projectWebUrl != null ? projectWebUrl + "/-/tree/" + branchName : null;
        boolean branchCreated = NULL_SHA.equals(text(payload.path("before")));

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

    private void handleMergeRequest(ProjectAggregate project, JsonNode payload) {
        JsonNode attributes = payload.path("object_attributes");
        String id = text(attributes.path("iid"));
        String title = text(attributes.path("title"));
        String description = text(attributes.path("description"));
        String url = text(attributes.path("url"));
        PullRequestStatus status = toStatus(text(attributes.path("state")));

        String action = text(attributes.path("action"));
        boolean openingEvent = "open".equals(action) || "reopen".equals(action);

        this.linker.linkPullRequest(project, id, title, description, status, url, openingEvent);
    }

    private void handleApproval(ProjectAggregate project, JsonNode payload) {
        JsonNode mergeRequest = payload.has("merge_request") ? payload.path("merge_request") : payload.path("object_attributes");

        String id = text(mergeRequest.path("iid"));
        String title = text(mergeRequest.path("title"));
        String description = text(mergeRequest.path("description"));
        String url = text(mergeRequest.path("url"));
        String reviewer = text(payload.path("user").path("username"));

        String eventType = text(payload.path("event_type"));
        boolean approved = eventType == null || !eventType.toLowerCase().contains("unapprov");

        if (id == null || reviewer == null) {
            return;
        }

        this.linker.linkPullRequestApproval(project, id, title, description, url, reviewer, approved);
    }

    private PullRequestStatus toStatus(String state) {
        if ("merged".equals(state)) {
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
            return OffsetDateTime.parse(value).toInstant();
        } catch (DateTimeParseException exception) {
            return null;
        }
    }

    private String text(JsonNode node) {
        return node == null || node.isMissingNode() || node.isNull() ? null : node.asText();
    }
}
