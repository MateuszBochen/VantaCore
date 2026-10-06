package vantaCore.application.vcs.appliaction.query.listVcsConnections;

import vantaCore.application.vcs.domain.vo.VcsProvider;

import java.util.UUID;

/** No webhookUrl/webhookSecret here - those are shown once, only in the create response (see
 VcsConnectionResult) and never again, per the connection setup UX described in the sub-project's
 Solution Design. */
public record VcsConnectionSummaryResult(UUID id, VcsProvider provider, String repoUrl) {
}
