package vantaCore.application.vcs.domain.vo;

import java.time.Instant;

/** Upserted by name - one entry per branch, always holding its latest known commit (see
 DevelopmentActivityAggregate.withBranch). */
public record DevelopmentBranch(String name, String lastCommitSha, Instant lastCommitAt, String url) {
}
