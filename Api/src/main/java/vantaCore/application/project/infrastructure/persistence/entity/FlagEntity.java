package vantaCore.application.project.infrastructure.persistence.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import vantaCore.application.project.domain.vo.Flag;

import java.util.UUID;

@Entity
@Table(name = "project_flags")
public class FlagEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private ProjectEntity project;

    private String name;
    private String color;

    // Hibernate requires it
    protected FlagEntity() {}

    private FlagEntity(
        UUID id,
        ProjectEntity project,
        String name,
        String color
    ) {
        this.id = id;
        this.project = project;
        this.name = name;
        this.color = color;
    }

    public static FlagEntity fromDomain(Flag flag, ProjectEntity project) {
        return new FlagEntity(
            flag.id(),
            project,
            flag.name(),
            flag.color()
        );
    }

    public Flag toDomain() {
        return new Flag(
            this.id,
            this.name,
            this.color
        );
    }
}