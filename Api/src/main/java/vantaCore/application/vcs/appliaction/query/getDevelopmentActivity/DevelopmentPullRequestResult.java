package vantaCore.application.vcs.appliaction.query.getDevelopmentActivity;

import vantaCore.application.vcs.domain.vo.PullRequestStatus;

public record DevelopmentPullRequestResult(String id, String title, PullRequestStatus status, int approvalsCount, String url) {
}
