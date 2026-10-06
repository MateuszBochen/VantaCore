package vantaCore.application.user.appliaction.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

import java.util.Set;
import java.util.UUID;

final public class AssignRolesToUserRequest {

    @NotNull
    private final Set<UUID> roleIds;

    // Explicit @JsonCreator/@JsonProperty - single-argument constructors are ambiguous for Jackson's
    // implicit creator detection (delegating vs. properties-based), same issue as CommentRequest.
    @JsonCreator
    public AssignRolesToUserRequest(@JsonProperty("roleIds") Set<UUID> roleIds) {
        this.roleIds = roleIds;
    }

    public Set<UUID> getRoleIds() {
        return roleIds;
    }
}
