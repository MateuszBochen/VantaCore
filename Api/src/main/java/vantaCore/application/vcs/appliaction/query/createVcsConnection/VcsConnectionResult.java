package vantaCore.application.vcs.appliaction.query.createVcsConnection;

import vantaCore.application.vcs.domain.vo.VcsProvider;

import java.util.UUID;

/** webhookUrl/webhookSecret only ever appear in THIS response - see ListVcsConnectionsQuery's own
 result type for the (deliberately narrower) shape returned on every later GET. */
public record VcsConnectionResult(UUID id, VcsProvider provider, String repoUrl, String webhookUrl, String webhookSecret) {
}
