package vantaCore.application.release.infrastructure.persistence.entity;

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
import vantaCore.application.release.domain.ReleaseAggregate;
import vantaCore.application.release.domain.ReleaseSnapshot;
import vantaCore.application.release.domain.vo.ReleaseId;
import vantaCore.application.release.domain.vo.ReleaseStatus;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "releases")
public class ReleaseEntity {

    @Id
    private UUID id;

    private UUID projectId;
    private LocalDate plannedReleaseDate;

    @Column(name = "after_care_period")
    private String afterCarePeriod;

    @Enumerated(EnumType.STRING)
    private ReleaseStatus status;

    private String versionNumber;
    private String name;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "release_tickets",
        joinColumns = @JoinColumn(name = "release_id")
    )
    @Column(name = "ticket_id")
    private Set<UUID> ticketIds = new HashSet<>();

    // Hibernate requires it
    protected ReleaseEntity() {}

    private ReleaseEntity(
        UUID id,
        UUID projectId,
        LocalDate plannedReleaseDate,
        String afterCarePeriod,
        ReleaseStatus status,
        String versionNumber,
        String name,
        Set<UUID> ticketIds
    ) {
        this.id = id;
        this.projectId = projectId;
        this.plannedReleaseDate = plannedReleaseDate;
        this.afterCarePeriod = afterCarePeriod;
        this.status = status;
        this.versionNumber = versionNumber;
        this.name = name;
        this.ticketIds = ticketIds;
    }

    public static ReleaseEntity fromDomain(ReleaseAggregate release) {
        ReleaseSnapshot snapshot = release.toSnapshot();

        return new ReleaseEntity(
            snapshot.id().value(),
            snapshot.projectId(),
            snapshot.plannedReleaseDate(),
            snapshot.afterCarePeriod(),
            snapshot.status(),
            snapshot.versionNumber(),
            snapshot.name(),
            new HashSet<>(snapshot.ticketIds())
        );
    }

    public ReleaseAggregate toDomain() {
        return ReleaseAggregate.newRelease(
            new ReleaseId(this.id),
            this.projectId,
            this.plannedReleaseDate,
            this.afterCarePeriod,
            this.status,
            this.versionNumber,
            this.name,
            this.ticketIds
        );
    }
}
