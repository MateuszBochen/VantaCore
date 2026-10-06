package vantaCore.application.documentation.search.appliaction.query.askDocumentation;

import org.springframework.stereotype.Component;
import vantaCore.application.documentation.search.appliaction.dto.AskDocumentationRequest;
import vantaCore.application.documentation.search.domain.DocumentationChunk;
import vantaCore.application.documentation.search.domain.repository.DocumentationChunkRepositoryInterface;
import vantaCore.application.documentation.search.domain.vo.DocumentationSearchScope;
import vantaCore.application.documentation.search.infrastructure.ollama.OllamaClient;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;

import java.util.List;
import java.util.UUID;

@Component
final public class AskDocumentationQueryHandler implements QueryHandlerInterface<AskDocumentationQuery, Item<AskDocumentationResult>> {

    private static final int TOP_K = 6;
    private static final int EXCERPT_MAX_CHARS = 240;
    private static final String NO_MATCH_ANSWER = "Nie znalazłem nic na ten temat w dokumentacji.";

    private final ProjectAggregateRepositoryInterface projectRepository;
    private final DocumentationChunkRepositoryInterface repository;
    private final OllamaClient ollamaClient;

    public AskDocumentationQueryHandler(
        ProjectAggregateRepositoryInterface projectRepository,
        DocumentationChunkRepositoryInterface repository,
        OllamaClient ollamaClient
    ) {
        this.projectRepository = projectRepository;
        this.repository = repository;
        this.ollamaClient = ollamaClient;
    }

    @Override
    public Item<AskDocumentationResult> handle(AskDocumentationQuery query) {
        ProjectId projectId = new ProjectId(query.getProjectId());
        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);

        AskDocumentationRequest request = query.getAskDocumentationRequest();
        DocumentationSearchScope scope = request.getScope() == null ? DocumentationSearchScope.PROJECT : request.getScope();
        // ALL scope isn't access-filtered - see the "Whole app" scoping discussion this feature was
        // built from; every project's documentation is searchable regardless of the caller's
        // individual project membership.
        UUID scopedProjectId = scope == DocumentationSearchScope.ALL ? null : projectId.value();

        float[] questionEmbedding = this.ollamaClient.embed(List.of(request.getQuestion())).get(0);
        List<DocumentationChunk> matches = this.repository.findNearest(scopedProjectId, questionEmbedding, TOP_K);

        AskDocumentationResult result = matches.isEmpty()
            ? new AskDocumentationResult(NO_MATCH_ANSWER, List.of())
            : answerFromMatches(request.getQuestion(), matches);

        return Item.fromPayload(projectId.toString(), result);
    }

    private AskDocumentationResult answerFromMatches(String question, List<DocumentationChunk> matches) {
        String answer = this.ollamaClient.generate(buildPrompt(question, matches));

        List<AskDocumentationSourceResult> sources = matches.stream()
            .map(chunk -> new AskDocumentationSourceResult(
                chunk.sourceType(),
                chunk.sourceId(),
                chunk.projectId(),
                chunk.label(),
                excerpt(chunk.content())
            ))
            .toList();

        return new AskDocumentationResult(answer, sources);
    }

    private String buildPrompt(String question, List<DocumentationChunk> matches) {
        StringBuilder context = new StringBuilder();
        int sourceNumber = 1;

        for (DocumentationChunk chunk : matches) {
            context.append("[Źródło ").append(sourceNumber++).append(": ").append(chunk.label()).append("]\n")
                .append(chunk.content()).append("\n\n");
        }

        return """
            Jesteś asystentem odpowiadającym na pytania na podstawie dokumentacji technicznej projektu.
            Odpowiadaj WYŁĄCZNIE na podstawie poniższego kontekstu. Jeśli odpowiedzi nie ma w kontekście,
            powiedz to wprost zamiast zgadywać. Odpowiadaj po polsku, konkretnie i zwięźle.

            Kontekst:
            %s
            Pytanie: %s

            Odpowiedź:
            """.formatted(context, question);
    }

    private String excerpt(String content) {
        return content.length() <= EXCERPT_MAX_CHARS ? content : content.substring(0, EXCERPT_MAX_CHARS) + "...";
    }
}
