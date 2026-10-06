package vantaCore.application.vcs.domain.vo;

import java.time.Instant;

/** Azure DevOps only (v1) - upserted by environment, so "Deployed to Staging" always reflects the
 latest known status for that environment, not a growing history of every deploy attempt. */
public record Deployment(String environment, DeploymentStatus status, Instant deployedAt) {
}
