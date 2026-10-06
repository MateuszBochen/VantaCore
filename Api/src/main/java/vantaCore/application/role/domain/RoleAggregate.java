package vantaCore.application.role.domain;

import vantaCore.application.role.domain.vo.RoleId;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.Set;

public class RoleAggregate {

    private final RoleId id;
    private final String name;
    private final boolean isSystem;
    private final Set<Resource> resources;

    private RoleAggregate(RoleId id, String name, boolean isSystem, Set<Resource> resources) {
        this.id = id;
        this.name = name;
        this.isSystem = isSystem;
        this.resources = resources == null ? Set.of() : Set.copyOf(resources);
    }

    /** A brand-new, user-created role. Application code can never mint a system role through here. */
    public static RoleAggregate create(RoleId id, String name, Set<Resource> resources) {
        return new RoleAggregate(id, name, false, resources);
    }

    /** Rebuilds a role from storage - the only path that can produce isSystem = true, driven by the
     persisted flag rather than application code. */
    public static RoleAggregate reconstruct(RoleId id, String name, boolean isSystem, Set<Resource> resources) {
        return new RoleAggregate(id, name, isSystem, resources);
    }

    /** Replaces this role's editable fields - id and isSystem are fixed for the role's lifetime and
     always carry over from the current instance. Callers must block this for system roles via
     NonSystemRolePolicy before invoking it. */
    public RoleAggregate changeRole(String name, Set<Resource> resources) {
        return new RoleAggregate(this.id, name, this.isSystem, resources);
    }

    /** True if this role permits the given resource - a system role always grants everything,
     including resources added after the role was created. */
    public boolean grants(Resource resource) {
        return this.isSystem || this.resources.contains(resource);
    }

    public RoleId getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public boolean isSystem() {
        return isSystem;
    }

    public Set<Resource> getResources() {
        return resources;
    }
}
