package vantaCore.application.documentation.search.domain.repository;

import vantaCore.application.documentation.search.domain.DocumentationChunk;

import java.util.List;
import java.util.UUID;

public interface DocumentationChunkRepositoryInterface {

    /** Atomically replaces every chunk belonging to this owner group (see DocumentationChunk's
     ownerId doc) - the index only ever reflects each source's latest version, never accumulates
     stale chunks from earlier saves. Scoped to ownerId, not the whole project, so reindexing one
     sub-project's docs (or Platform Documentation) never touches another owner group's chunks in
     the same project. chunks may be empty (a save that wiped this owner's content back to blank). */
    void replaceAllForOwner(UUID projectId, UUID ownerId, List<DocumentationChunk> chunks);

    /** Nearest neighbors by cosine similarity, most similar first. projectId null = every project
     ("Whole app" scope) - see DocumentationSearchScope. */
    List<DocumentationChunk> findNearest(UUID projectId, float[] queryEmbedding, int limit);
}
