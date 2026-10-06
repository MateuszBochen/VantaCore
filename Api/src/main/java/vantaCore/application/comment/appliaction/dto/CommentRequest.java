package vantaCore.application.comment.appliaction.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

final public class CommentRequest {

    @NotBlank
    private final String body;

    // Explicit @JsonCreator/@JsonProperty - single-argument constructors are ambiguous for Jackson's
    // implicit creator detection (delegating vs. properties-based), same issue as StartWorklogRequest.
    @JsonCreator
    public CommentRequest(@JsonProperty("body") String body) {
        this.body = body;
    }

    public String getBody() {
        return body;
    }
}
