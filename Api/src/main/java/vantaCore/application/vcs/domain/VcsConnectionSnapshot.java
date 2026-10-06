package vantaCore.application.vcs.domain;

import vantaCore.application.vcs.domain.vo.VcsConnectionId;
import vantaCore.application.vcs.domain.vo.VcsProvider;

import java.time.Instant;
import java.util.UUID;

/** webhookSecret is decrypted only here, server-side (see JpaVcsConnectionRepositoryAdapter) - it's
 used to verify inbound webhook signatures, never returned to the frontend after the connection was
 first created (see VcsConnectionResult vs. ListVcsConnectionsResult). */
public record VcsConnectionSnapshot(
    VcsConnectionId id,
    UUID projectId,
    VcsProvider provider,
    String repoUrl,
    String webhookSecret,
    UUID createdByUserId,
    Instant createdAt
) {
}
