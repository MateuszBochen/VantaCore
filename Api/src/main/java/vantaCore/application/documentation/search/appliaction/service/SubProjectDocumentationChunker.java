package vantaCore.application.documentation.search.appliaction.service;

import org.springframework.stereotype.Component;
import vantaCore.application.documentation.search.domain.vo.DocumentationSourceType;
import vantaCore.application.subProject.domain.SubProjectAggregate;
import vantaCore.application.subProject.domain.vo.Adr;
import vantaCore.application.subProject.domain.vo.SubProjectDocumentation;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** Turns one sub-project's saved documentation (Project Docs + ADRs) into the set of text chunks
 to embed. scope/impactAnalysis/solutionDesign are chunked as three separate sources (not
 concatenated into one) so a citation can point at the specific tab it came from; each ADR is its
 own source too, keyed by the ADR's own id rather than the sub-project's. */
@Component
public class SubProjectDocumentationChunker {

    private final MarkdownChunkSplitter markdownChunkSplitter;

    public SubProjectDocumentationChunker(MarkdownChunkSplitter markdownChunkSplitter) {
        this.markdownChunkSplitter = markdownChunkSplitter;
    }

    public List<PendingChunk> chunk(SubProjectAggregate subProject) {
        List<PendingChunk> chunks = new ArrayList<>();
        SubProjectDocumentation documentation = subProject.getDocumentation();
        UUID subProjectId = subProject.getSubProjectId().value();
        String subProjectName = subProject.getName() != null ? subProject.getName().value() : "Sub-project";

        // sourceId = the sub-project's own id here (not null) - unlike PLATFORM_NODE/SUB_PROJECT_ADR
        // these three fields have no entity of their own, but the frontend still needs an id to
        // navigate a citation to "this sub-project's Project Docs", so the sub-project id fills
        // that role.
        addMarkdownChunks(chunks, documentation.scope(), DocumentationSourceType.SUB_PROJECT_SCOPE, subProjectId, subProjectName + " - Scope");
        addMarkdownChunks(chunks, documentation.impactAnalysis(), DocumentationSourceType.SUB_PROJECT_IMPACT_ANALYSIS, subProjectId, subProjectName + " - Impact Analysis");
        addMarkdownChunks(chunks, documentation.solutionDesign(), DocumentationSourceType.SUB_PROJECT_SOLUTION_DESIGN, subProjectId, subProjectName + " - Solution Design");

        for (Adr adr : documentation.adrs()) {
            addAdrChunks(chunks, adr, subProjectName);
        }

        return chunks;
    }

    private void addMarkdownChunks(List<PendingChunk> chunks, String markdown, DocumentationSourceType sourceType, UUID sourceId, String label) {
        for (String piece : this.markdownChunkSplitter.split(markdown)) {
            chunks.add(new PendingChunk(sourceType, sourceId, label, piece));
        }
    }

    private void addAdrChunks(List<PendingChunk> chunks, Adr adr, String subProjectName) {
        if (adr.content() == null || adr.content().isBlank()) {
            return;
        }

        String label = subProjectName + " - ADR: " + (adr.title() != null ? adr.title() : adr.id());

        for (String piece : this.markdownChunkSplitter.split(adr.content())) {
            chunks.add(new PendingChunk(DocumentationSourceType.SUB_PROJECT_ADR, adr.id(), label, piece));
        }
    }
}
