package vantaCore.application.ticket.infrastructure.persistence.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import vantaCore.application.ticket.domain.TicketAggregate;
import vantaCore.application.ticket.domain.TicketSnapshot;
import vantaCore.application.ticket.domain.vo.TicketId;
import vantaCore.application.ticket.domain.vo.TicketKey;
import vantaCore.application.ticket.domain.vo.TicketRelation;

import java.time.Instant;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "tickets")
public class TicketEntity {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<Map<String, Object>> CUSTOM_FIELDS_TYPE = new TypeReference<>() {};
    private static final TypeReference<Set<TicketRelation>> RELATED_TICKETS_TYPE = new TypeReference<>() {};

    @Id
    private UUID id;

    private String key;
    private UUID authorId;
    private UUID projectId;
    private UUID subProjectId;
    private UUID issueTypeId;
    private UUID statusId;
    private UUID parentId;
    private String title;

    @Column(columnDefinition = "text")
    private String description;

    private Integer priority;
    private double estimate;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "ticket_assignees", joinColumns = @JoinColumn(name = "ticket_id"))
    @Column(name = "user_id")
    private Set<UUID> assigneeIds = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "ticket_flags", joinColumns = @JoinColumn(name = "ticket_id"))
    @Column(name = "flag_id")
    private Set<UUID> flagIds = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "ticket_tags", joinColumns = @JoinColumn(name = "ticket_id"))
    @Column(name = "tag")
    private Set<String> tags = new HashSet<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "related_tickets", columnDefinition = "jsonb", nullable = false)
    private String relatedTickets;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private String customFields;

    private Instant createdAt;
    private Instant changedAt;
    private Instant doneAt;

    // Hibernate requires it
    protected TicketEntity() {}

    private TicketEntity(
        UUID id,
        String key,
        UUID authorId,
        UUID projectId,
        UUID subProjectId,
        UUID issueTypeId,
        UUID statusId,
        UUID parentId,
        String title,
        String description,
        Integer priority,
        double estimate,
        Set<UUID> assigneeIds,
        Set<UUID> flagIds,
        Set<String> tags,
        String relatedTickets,
        String customFields,
        Instant createdAt,
        Instant changedAt,
        Instant doneAt
    ) {
        this.id = id;
        this.key = key;
        this.authorId = authorId;
        this.projectId = projectId;
        this.subProjectId = subProjectId;
        this.issueTypeId = issueTypeId;
        this.statusId = statusId;
        this.parentId = parentId;
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.estimate = estimate;
        this.assigneeIds = assigneeIds;
        this.flagIds = flagIds;
        this.tags = tags;
        this.relatedTickets = relatedTickets;
        this.customFields = customFields;
        this.createdAt = createdAt;
        this.changedAt = changedAt;
        this.doneAt = doneAt;
    }

    public static TicketEntity fromDomain(TicketAggregate ticket) {
        TicketSnapshot snapshot = ticket.toSnapshot();

        return new TicketEntity(
            snapshot.id().value(),
            snapshot.key().value(),
            snapshot.authorId(),
            snapshot.projectId(),
            snapshot.subProjectId(),
            snapshot.issueTypeId(),
            snapshot.statusId(),
            snapshot.parentId(),
            snapshot.title(),
            snapshot.description(),
            snapshot.priority(),
            snapshot.estimate(),
            new HashSet<>(snapshot.assigneeIds()),
            new HashSet<>(snapshot.flagIds()),
            new HashSet<>(snapshot.tags()),
            writeRelatedTickets(snapshot.relatedTickets()),
            writeCustomFields(snapshot.customFields()),
            snapshot.createdAt(),
            snapshot.changedAt(),
            snapshot.doneAt()
        );
    }

    public TicketAggregate toDomain() {
        return TicketAggregate.newTicket(
            new TicketId(this.id),
            new TicketKey(this.key),
            this.authorId,
            this.projectId,
            this.subProjectId,
            this.issueTypeId,
            this.statusId,
            this.parentId,
            this.title,
            this.description,
            this.priority,
            this.estimate,
            this.assigneeIds,
            this.flagIds,
            this.tags,
            readCustomFields(this.customFields),
            readRelatedTickets(this.relatedTickets),
            this.createdAt,
            this.changedAt,
            this.doneAt
        );
    }

    private static String writeCustomFields(Map<String, Object> customFields) {
        try {
            return MAPPER.writeValueAsString(customFields == null ? Map.of() : customFields);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize ticket custom fields", e);
        }
    }

    private static Map<String, Object> readCustomFields(String json) {
        try {
            return MAPPER.readValue(json, CUSTOM_FIELDS_TYPE);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to deserialize ticket custom fields", e);
        }
    }

    private static String writeRelatedTickets(Set<TicketRelation> relatedTickets) {
        try {
            return MAPPER.writeValueAsString(relatedTickets == null ? Set.of() : relatedTickets);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize ticket related tickets", e);
        }
    }

    private static Set<TicketRelation> readRelatedTickets(String json) {
        try {
            return MAPPER.readValue(json, RELATED_TICKETS_TYPE);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to deserialize ticket related tickets", e);
        }
    }
}
