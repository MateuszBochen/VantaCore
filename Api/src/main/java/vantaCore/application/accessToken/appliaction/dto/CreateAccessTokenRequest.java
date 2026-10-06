package vantaCore.application.accessToken.appliaction.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

/** expiresAt null = never expires. resources null/empty = everything the user can do; otherwise
 resource codes (e.g. "ticket:view", same codes as GET /api/role/resource) to narrow the token to. */
final public class CreateAccessTokenRequest {

    @NotBlank
    @Size(max = 100)
    private final String name;

    private final Instant expiresAt;

    private final List<String> resources;

    public CreateAccessTokenRequest(String name, Instant expiresAt, List<String> resources) {
        this.name = name;
        this.expiresAt = expiresAt;
        this.resources = resources;
    }

    public String getName() {
        return name;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public List<String> getResources() {
        return resources;
    }
}
