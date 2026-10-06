package vantaCore.application.documentation.search.appliaction.service;

import vantaCore.application.documentation.search.domain.vo.DocumentationSourceType;

import java.util.UUID;

/** A chunk of text ready to be embedded, before it has an id/embedding/createdAt - what a chunker
 (DocumentationChunker, SubProjectDocumentationChunker) produces; the reindexing event handler
 turns each one into a DocumentationChunk once it has an embedding. */
public record PendingChunk(DocumentationSourceType sourceType, UUID sourceId, String label, String content) {
}
