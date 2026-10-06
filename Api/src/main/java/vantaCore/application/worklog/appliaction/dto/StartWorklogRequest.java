package vantaCore.application.worklog.appliaction.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

final public class StartWorklogRequest {

    @NotNull
    private final Instant startedAt;

    // Explicit @JsonCreator/@JsonProperty because this is the only single-argument request DTO in the
    // codebase - Jackson's implicit constructor detection is ambiguous for exactly one constructor
    // parameter (delegating creator, i.e. "build from one raw JSON value", vs properties creator, i.e.
    // "build from a JSON object with this named field") and picked neither here, failing with
    // "Type definition error" instead of silently guessing. Every other DTO in this codebase has 2+
    // constructor params, where that ambiguity doesn't exist, which is why this is the first to need it.
    @JsonCreator
    public StartWorklogRequest(@JsonProperty("startedAt") Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getStartedAt() {
        return startedAt;
    }
}
