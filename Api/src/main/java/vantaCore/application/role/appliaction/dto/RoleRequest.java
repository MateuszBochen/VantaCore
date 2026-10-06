package vantaCore.application.role.appliaction.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.Set;

final public class RoleRequest {

    @NotBlank
    @Size(max = 255)
    private final String name;

    @NotNull
    private final Set<Resource> resources;

    public RoleRequest(String name, Set<Resource> resources) {
        this.name = name;
        this.resources = resources;
    }

    public String getName() {
        return name;
    }

    public Set<Resource> getResources() {
        return resources;
    }
}
