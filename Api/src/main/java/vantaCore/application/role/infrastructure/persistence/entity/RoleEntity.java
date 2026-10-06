package vantaCore.application.role.infrastructure.persistence.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import vantaCore.application.role.domain.RoleAggregate;
import vantaCore.application.role.domain.vo.RoleId;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "roles")
public class RoleEntity {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(name = "is_system", nullable = false)
    private boolean isSystem;

    @ElementCollection(fetch = FetchType.EAGER)
    @Enumerated(EnumType.STRING)
    @CollectionTable(
        name = "role_resources",
        joinColumns = @JoinColumn(name = "role_id")
    )
    @Column(name = "resource")
    private Set<Resource> resources = new HashSet<>();

    // Hibernate requires it
    protected RoleEntity() {}

    private RoleEntity(UUID id, String name, boolean isSystem, Set<Resource> resources) {
        this.id = id;
        this.name = name;
        this.isSystem = isSystem;
        this.resources = resources;
    }

    public static RoleEntity fromDomain(RoleAggregate role) {
        return new RoleEntity(
            role.getId().value(),
            role.getName(),
            role.isSystem(),
            new HashSet<>(role.getResources())
        );
    }

    public RoleAggregate toDomain() {
        return RoleAggregate.reconstruct(
            new RoleId(this.id),
            this.name,
            this.isSystem,
            this.resources
        );
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }
}
