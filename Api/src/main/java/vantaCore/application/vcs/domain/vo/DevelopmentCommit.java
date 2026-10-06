package vantaCore.application.vcs.domain.vo;

import java.time.Instant;

/** Deduped by sha - the same commit landing in more than one push delivery (e.g. it touches a
 branch matching one ticket and its message mentions another) is still one entry per ticket, not
 doubled up within that ticket's own list. */
public record DevelopmentCommit(String sha, String message, String authorName, Instant authoredAt, String url) {
}
