package vantaCore.application.project.infrastructure.persistence.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import vantaCore.application.project.domain.vo.Status;

import java.util.UUID;

@Entity
@Table(name = "project_statuses")
public class StatusEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private ProjectEntity project;

    private String name;
    private String color;
    private boolean isDone;

    // Hibernate requires it
    protected StatusEntity() {}

    private StatusEntity(UUID id, ProjectEntity project, String name, String color, boolean isDone) {
        this.id = id;
        this.project = project;
        this.name = name;
        this.color = color;
        this.isDone = isDone;
    }

    public static StatusEntity fromDomain(Status status, ProjectEntity project) {
        return new StatusEntity(status.id(), project, status.name(), status.color(), status.isDone());
    }

    public Status toDomain() {
        return new Status(this.id, this.name, this.color, this.isDone);
    }
}
