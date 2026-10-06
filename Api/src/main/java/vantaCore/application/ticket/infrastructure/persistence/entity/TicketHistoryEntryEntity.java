package vantaCore.application.ticket.infrastructure.persistence.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import vantaCore.application.ticket.domain.history.TicketHistoryEntryAggregate;
import vantaCore.application.ticket.domain.history.TicketHistorySnapshot;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ticket_history")
public class TicketHistoryEntryEntity {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Id
    private UUID id;

    private UUID ticketId;
    private UUID changedByUserId;
    private String changedByEmail;
    private Instant changedAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private String snapshot;

    // Hibernate requires it
    protected TicketHistoryEntryEntity() {}

    private TicketHistoryEntryEntity(
        UUID id,
        UUID ticketId,
        UUID changedByUserId,
        String changedByEmail,
        Instant changedAt,
        String snapshot
    ) {
        this.id = id;
        this.ticketId = ticketId;
        this.changedByUserId = changedByUserId;
        this.changedByEmail = changedByEmail;
        this.changedAt = changedAt;
        this.snapshot = snapshot;
    }

    public static TicketHistoryEntryEntity fromDomain(TicketHistoryEntryAggregate entry) {
        var snapshot = entry.toSnapshot();

        return new TicketHistoryEntryEntity(
            snapshot.id(),
            snapshot.ticketId(),
            snapshot.changedByUserId(),
            snapshot.changedByEmail(),
            snapshot.changedAt(),
            writeSnapshot(snapshot.ticket())
        );
    }

    public TicketHistoryEntryAggregate toDomain() {
        return TicketHistoryEntryAggregate.newEntry(
            this.id,
            this.ticketId,
            this.changedByUserId,
            this.changedByEmail,
            this.changedAt,
            readSnapshot(this.snapshot)
        );
    }

    private static String writeSnapshot(TicketHistorySnapshot ticket) {
        try {
            return MAPPER.writeValueAsString(ticket);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize ticket history snapshot", e);
        }
    }

    private static TicketHistorySnapshot readSnapshot(String json) {
        try {
            return MAPPER.readValue(json, TicketHistorySnapshot.class);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to deserialize ticket history snapshot", e);
        }
    }
}
