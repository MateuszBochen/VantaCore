package vantaCore.application.sprint.infrastructure.persistence.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import vantaCore.application.sprint.domain.SprintAggregate;
import vantaCore.application.sprint.domain.SprintSnapshot;
import vantaCore.application.sprint.domain.vo.EstimateUnitValue;
import vantaCore.application.sprint.domain.vo.SprintId;
import vantaCore.application.sprint.domain.vo.SprintReportEntry;
import vantaCore.application.sprint.domain.vo.SprintStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "sprints")
public class SprintEntity {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<List<SprintReportEntry>> REPORT_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<EstimateUnitValue>> ESTIMATE_UNIT_TYPE = new TypeReference<>() {};

    @Id
    private UUID id;

    private UUID boardId;
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    private SprintStatus status;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "sprint_tickets", joinColumns = @JoinColumn(name = "sprint_id"))
    @Column(name = "ticket_id")
    private Set<UUID> ticketIds = new HashSet<>();

    private Instant startedAt;
    private UUID startedByUserId;
    private Instant closedAt;
    private UUID closedByUserId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private String report;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "initial_estimate_unit", columnDefinition = "jsonb", nullable = false)
    private String initialEstimateUnit;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "closing_estimate_unit", columnDefinition = "jsonb", nullable = false)
    private String closingEstimateUnit;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "actual_estimate_unit", columnDefinition = "jsonb", nullable = false)
    private String actualEstimateUnit;

    // Hibernate requires it
    protected SprintEntity() {}

    private SprintEntity(
        UUID id,
        UUID boardId,
        String name,
        LocalDate startDate,
        LocalDate endDate,
        SprintStatus status,
        Set<UUID> ticketIds,
        Instant startedAt,
        UUID startedByUserId,
        Instant closedAt,
        UUID closedByUserId,
        String report,
        String initialEstimateUnit,
        String closingEstimateUnit,
        String actualEstimateUnit
    ) {
        this.id = id;
        this.boardId = boardId;
        this.name = name;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
        this.ticketIds = ticketIds;
        this.startedAt = startedAt;
        this.startedByUserId = startedByUserId;
        this.closedAt = closedAt;
        this.closedByUserId = closedByUserId;
        this.report = report;
        this.initialEstimateUnit = initialEstimateUnit;
        this.closingEstimateUnit = closingEstimateUnit;
        this.actualEstimateUnit = actualEstimateUnit;
    }

    public static SprintEntity fromDomain(SprintAggregate sprint) {
        SprintSnapshot snapshot = sprint.toSnapshot();

        return new SprintEntity(
            snapshot.id().value(),
            snapshot.boardId(),
            snapshot.name(),
            snapshot.startDate(),
            snapshot.endDate(),
            snapshot.status(),
            new HashSet<>(snapshot.ticketIds()),
            snapshot.startedAt(),
            snapshot.startedByUserId(),
            snapshot.closedAt(),
            snapshot.closedByUserId(),
            writeJson(snapshot.report()),
            writeJson(snapshot.initialEstimateUnit()),
            writeJson(snapshot.closingEstimateUnit()),
            writeJson(snapshot.actualEstimateUnit())
        );
    }

    public SprintAggregate toDomain() {
        return SprintAggregate.newSprint(
            new SprintId(this.id),
            this.boardId,
            this.name,
            this.startDate,
            this.endDate,
            this.status,
            this.ticketIds,
            this.startedAt,
            this.startedByUserId,
            this.closedAt,
            this.closedByUserId,
            readJson(this.report, REPORT_TYPE),
            readJson(this.initialEstimateUnit, ESTIMATE_UNIT_TYPE),
            readJson(this.closingEstimateUnit, ESTIMATE_UNIT_TYPE),
            readJson(this.actualEstimateUnit, ESTIMATE_UNIT_TYPE)
        );
    }

    private static <T> String writeJson(T value) {
        try {
            return MAPPER.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize sprint field", e);
        }
    }

    private static <T> T readJson(String json, TypeReference<T> type) {
        try {
            return MAPPER.readValue(json, type);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to deserialize sprint field", e);
        }
    }
}
