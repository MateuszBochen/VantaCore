package vantaCore.application.documentation.search.appliaction.service;

import org.springframework.stereotype.Component;
import vantaCore.application.documentation.platform.domain.PlatformDocumentationAggregate;
import vantaCore.application.documentation.platform.domain.vo.GraphNode;
import vantaCore.application.documentation.platform.domain.vo.PlatformGraph;
import vantaCore.application.documentation.search.domain.vo.DocumentationSourceType;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/** Turns one Platform Documentation save into the set of text chunks to embed. */
@Component
public class DocumentationChunker {

    private final MarkdownChunkSplitter markdownChunkSplitter;

    public DocumentationChunker(MarkdownChunkSplitter markdownChunkSplitter) {
        this.markdownChunkSplitter = markdownChunkSplitter;
    }

    public List<PendingChunk> chunk(PlatformDocumentationAggregate documentation) {
        List<PendingChunk> chunks = new ArrayList<>();
        PlatformGraph graph = documentation.getGraph();

        addNodeChunks(chunks, graph.domains(), "Domain");
        addNodeChunks(chunks, graph.boundedContexts(), "Bounded Context");
        addNodeChunks(chunks, graph.components(), "Component");
        addNodeChunks(chunks, graph.dataFlowNodes(), "Data Flow Step");
        addNodeChunks(chunks, graph.infraClusters(), "Infrastructure Cluster");
        addNodeChunks(chunks, graph.infraServices(), "Infrastructure Service");

        addMarkdownChunks(chunks, documentation.getArchitectureOverview(), DocumentationSourceType.ARCHITECTURE_OVERVIEW, "Architecture Overview");
        addMarkdownChunks(chunks, documentation.getApi(), DocumentationSourceType.API, "API");

        return chunks;
    }

    private void addNodeChunks(List<PendingChunk> chunks, Set<GraphNode> nodes, String typeLabel) {
        for (GraphNode node : nodes) {
            if (node.description() == null || node.description().isBlank()) {
                continue;
            }

            String content = "[" + typeLabel + "] " + node.name() + "\n" + node.description();
            chunks.add(new PendingChunk(DocumentationSourceType.PLATFORM_NODE, node.id(), node.name(), content));
        }
    }

    private void addMarkdownChunks(List<PendingChunk> chunks, String markdown, DocumentationSourceType sourceType, String label) {
        for (String piece : this.markdownChunkSplitter.split(markdown)) {
            chunks.add(new PendingChunk(sourceType, null, label, piece));
        }
    }
}
