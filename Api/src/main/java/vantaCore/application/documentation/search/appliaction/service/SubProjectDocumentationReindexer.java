package vantaCore.application.documentation.search.appliaction.service;

import org.springframework.stereotype.Component;
import vantaCore.application.documentation.search.domain.DocumentationChunk;
import vantaCore.application.documentation.search.domain.repository.DocumentationChunkRepositoryInterface;
import vantaCore.application.documentation.search.infrastructure.ollama.OllamaClient;
import vantaCore.application.subProject.domain.SubProjectAggregate;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** Chunk + embed + replace for one sub-project's saved documentation - shared by the on-save event
 handler (ReindexDocumentationWhenSubProjectDocumentationWasUpdated) and the manual/backfill
 trigger (ReindexProjectDocumentationCommandHandler), so there's exactly one place that does this. */
@Component
public class SubProjectDocumentationReindexer {

    private final SubProjectDocumentationChunker chunker;
    private final OllamaClient ollamaClient;
    private final DocumentationChunkRepositoryInterface repository;

    public SubProjectDocumentationReindexer(
        SubProjectDocumentationChunker chunker,
        OllamaClient ollamaClient,
        DocumentationChunkRepositoryInterface repository
    ) {
        this.chunker = chunker;
        this.ollamaClient = ollamaClient;
        this.repository = repository;
    }

    public void reindex(SubProjectAggregate subProject) {
        UUID projectId = subProject.getProjectId().value();
        // One owner group per sub-project - see DocumentationChunk.ownerId. Reindexing this
        // sub-project never touches Platform Documentation's chunks or another sub-project's.
        UUID ownerId = subProject.getSubProjectId().value();

        List<PendingChunk> pending = this.chunker.chunk(subProject);

        if (pending.isEmpty()) {
            this.repository.replaceAllForOwner(projectId, ownerId, List.of());
            return;
        }

        List<float[]> embeddings = this.ollamaClient.embed(pending.stream().map(PendingChunk::content).toList());
        Instant now = Instant.now();

        List<DocumentationChunk> chunks = new ArrayList<>(pending.size());
        for (int i = 0; i < pending.size(); i++) {
            PendingChunk chunk = pending.get(i);
            chunks.add(new DocumentationChunk(
                UUID.randomUUID(),
                projectId,
                ownerId,
                chunk.sourceType(),
                chunk.sourceId(),
                chunk.label(),
                chunk.content(),
                embeddings.get(i),
                now
            ));
        }

        this.repository.replaceAllForOwner(projectId, ownerId, chunks);
    }
}
