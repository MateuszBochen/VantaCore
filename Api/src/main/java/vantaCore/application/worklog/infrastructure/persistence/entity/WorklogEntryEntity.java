package vantaCore.application.worklog.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import vantaCore.application.worklog.domain.WorklogEntryAggregate;
import vantaCore.application.worklog.domain.vo.WorklogEntryId;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "worklog_entries")
public class WorklogEntryEntity {

    @Id
    private UUID id;

    private UUID ticketId;
    private UUID userId;
    private int minutes;

    @Column(name = "entry_date")
    private LocalDateTime date;

    @Column(columnDefinition = "text")
    private String note;

    private Instant createdAt;

    // Hibernate requires it
    protected WorklogEntryEntity() {}

    private WorklogEntryEntity(
        UUID id,
        UUID ticketId,
        UUID userId,
        int minutes,
        LocalDateTime date,
        String note,
        Instant createdAt
    ) {
        this.id = id;
        this.ticketId = ticketId;
        this.userId = userId;
        this.minutes = minutes;
        this.date = date;
        this.note = note;
        this.createdAt = createdAt;
    }

    public static WorklogEntryEntity fromDomain(WorklogEntryAggregate entry) {
        var snapshot = entry.toSnapshot();

        return new WorklogEntryEntity(
            snapshot.id().value(),
            snapshot.ticketId(),
            snapshot.userId(),
            snapshot.minutes(),
            snapshot.date(),
            snapshot.note(),
            snapshot.createdAt()
        );
    }

    public WorklogEntryAggregate toDomain() {
        return WorklogEntryAggregate.newEntry(
            new WorklogEntryId(this.id),
            this.ticketId,
            this.userId,
            this.minutes,
            this.date,
            this.note,
            this.createdAt
        );
    }
}
