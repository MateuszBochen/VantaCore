package vantaCore.application.documentation.search.domain;

import vantaCore.application.documentation.search.domain.vo.DocumentationSourceType;

import java.time.Instant;
import java.util.UUID;

/** A single embedded piece of a project's documentation - not a rich aggregate, this is a
 materialized/derived index entry (same spirit as the tsvector search_vector columns elsewhere in
 this app), rebuilt wholesale on every reindex rather than edited in place.

 embedding is write-only from the read side's point of view - findNearest never needs to hand the
 vector back to application code (Postgres does the distance comparison in SQL), so a chunk built
 from a repository read leaves it null; only chunks built for replaceAllForOwner carry it.

 ownerId identifies which "document group" this chunk came from, for replaceAllForOwner's
 wipe-and-replace scope - projectId itself for Platform Documentation (one group per project),
 the sub-project's id for Project Docs/ADRs (one group per sub-project, several per project).
 Like embedding, it's write-only: findNearest doesn't need it, only the reindexing handlers do. */
public record DocumentationChunk(
    UUID id,
    UUID projectId,
    UUID ownerId,
    DocumentationSourceType sourceType,
    // Points at whatever entity this chunk lets the frontend navigate a citation to - the node's
    // own id for PLATFORM_NODE, the ADR's own id for SUB_PROJECT_ADR, the owning sub-project's id
    // for SUB_PROJECT_SCOPE/IMPACT_ANALYSIS/SOLUTION_DESIGN (they have no entity of their own).
    // null only for ARCHITECTURE_OVERVIEW/API - a project has exactly one of each, nothing to link to.
    UUID sourceId,
    String label,
    String content,
    float[] embedding,
    Instant createdAt
) {
}
