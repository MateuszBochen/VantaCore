package vantaCore.application.release.domain.policy;

import vantaCore.application.release.domain.vo.ReleaseId;

import java.util.UUID;

/** releaseId is the release being upserted - excluded from its own duplicate-version check so
 re-saving a release with the same version it already had doesn't trip the uniqueness rule. */
public record UpsertReleaseCheck(UUID projectId, String versionNumber, ReleaseId releaseId) {
}
