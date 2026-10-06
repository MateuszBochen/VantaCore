package vantaCore.application.documentation.search.appliaction.query.askDocumentation;

import vantaCore.application.documentation.search.domain.vo.DocumentationSourceType;

import java.util.UUID;

public record AskDocumentationSourceResult(
    DocumentationSourceType sourceType,
    // null for ARCHITECTURE_OVERVIEW/API sources - see DocumentationChunk.sourceId.
    UUID sourceId,
    UUID projectId,
    String label,
    String excerpt
) {
}
