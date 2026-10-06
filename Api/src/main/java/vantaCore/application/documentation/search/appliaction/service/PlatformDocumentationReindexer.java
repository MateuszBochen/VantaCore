package vantaCore.application.documentation.search.appliaction.service;

import org.springframework.stereotype.Component;
import vantaCore.application.documentation.platform.domain.PlatformDocumentationAggregate;
import vantaCore.application.documentation.search.domain.DocumentationChunk;
import vantaCore.application.documentation.search.domain.repository.DocumentationChunkRepositoryInterface;
import vantaCore.application.documentation.search.infrastructure.ollama.OllamaClient;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** Chunk + embed + replace for one Platform Documentation save - shared by the on-save event
 handler (ReindexDocumentationWhenPlatformDocumentationWasUpdated) and the manual/backfill trigger
 (ReindexProjectDocumentationCommandHandler), so there's exactly one place that does this. */
@Component
public class PlatformDocumentationReindexer {

    private final DocumentationChunker chunker;
    private final OllamaClient ollamaClient;
    private final DocumentationChunkRepositoryInterface repository;

    public PlatformDocumentationReindexer(
        DocumentationChunker chunker,
        OllamaClient ollamaClient,
        DocumentationChunkRepositoryInterface repository
    ) {
        this.chunker = chunker;
        this.ollamaClient = ollamaClient;
        this.repository = repository;
    }

    public void reindex(PlatformDocumentationAggregate documentation) {
        UUID projectId = documentation.getProjectId().value();
        // Platform Documentation is a single group per project - see DocumentationChunk.ownerId.
        UUID ownerId = projectId;

        List<PendingChunk> pending = this.chunker.chunk(documentation);

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
