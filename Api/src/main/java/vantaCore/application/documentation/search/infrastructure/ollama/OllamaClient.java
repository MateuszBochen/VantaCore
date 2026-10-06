package vantaCore.application.documentation.search.infrastructure.ollama;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

// Plain RestClient (spring-web, already on the classpath - no new dependency) rather than a
// Spring AI starter - only two HTTP calls are needed (embed, generate), not enough surface to
// justify pulling in Spring AI's abstractions/dependency tree.
@Component
public class OllamaClient {

    private final RestClient restClient;
    private final String embeddingModel;
    private final String generationModel;

    public OllamaClient(
        @Value("${app.ollama.base-url}") String baseUrl,
        @Value("${app.ollama.embedding-model}") String embeddingModel,
        @Value("${app.ollama.generation-model}") String generationModel
    ) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.embeddingModel = embeddingModel;
        this.generationModel = generationModel;
    }

    /** One embedding per input string, same order. Empty input short-circuits without a call. */
    public List<float[]> embed(List<String> texts) {
        if (texts.isEmpty()) {
            return List.of();
        }

        EmbedResponse response = this.restClient.post()
            .uri("/api/embed")
            .body(new EmbedRequest(this.embeddingModel, texts))
            .retrieve()
            .body(EmbedResponse.class);

        return response.embeddings().stream().map(this::toFloatArray).toList();
    }

    /** Non-streaming completion (stream=false) - the ask endpoint returns one finished answer, not
     a token stream, so there's no reason to deal with Ollama's chunked response mode here. */
    public String generate(String prompt) {
        GenerateResponse response = this.restClient.post()
            .uri("/api/generate")
            .body(new GenerateRequest(this.generationModel, prompt, false))
            .retrieve()
            .body(GenerateResponse.class);

        return response.response();
    }

    private float[] toFloatArray(List<Double> values) {
        float[] result = new float[values.size()];
        for (int i = 0; i < values.size(); i++) {
            result[i] = values.get(i).floatValue();
        }
        return result;
    }

    private record EmbedRequest(String model, List<String> input) {
    }

    private record EmbedResponse(List<List<Double>> embeddings) {
    }

    private record GenerateRequest(String model, String prompt, boolean stream) {
    }

    private record GenerateResponse(String response) {
    }
}
