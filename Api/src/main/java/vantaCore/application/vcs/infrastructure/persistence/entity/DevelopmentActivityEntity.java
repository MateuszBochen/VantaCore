package vantaCore.application.vcs.infrastructure.persistence.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import vantaCore.application.vcs.domain.DevelopmentActivityAggregate;
import vantaCore.application.vcs.domain.DevelopmentActivitySnapshot;
import vantaCore.application.vcs.domain.vo.Deployment;
import vantaCore.application.vcs.domain.vo.DevelopmentBranch;
import vantaCore.application.vcs.domain.vo.DevelopmentCommit;
import vantaCore.application.vcs.domain.vo.DevelopmentPullRequest;

import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "development_activities")
public class DevelopmentActivityEntity {

    // Unlike this codebase's other jsonb-entity mappers (AutomationEngineRuleEntity,
    // WebhookSubscriptionEntity, ...), the VOs stored here (DevelopmentBranch/DevelopmentCommit/
    // Deployment) carry java.time.Instant fields - a bare `new ObjectMapper()` has no jsr310 module
    // registered (unlike the app's Spring-managed ObjectMapper bean, which gets it via Spring Boot
    // auto-configuration) and throws InvalidDefinitionException on the very first real write.
    private static final ObjectMapper MAPPER = new ObjectMapper()
        .registerModule(new JavaTimeModule())
        .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    private static final TypeReference<Set<DevelopmentBranch>> BRANCHES_TYPE = new TypeReference<>() {};
    private static final TypeReference<Set<DevelopmentCommit>> COMMITS_TYPE = new TypeReference<>() {};
    private static final TypeReference<Set<DevelopmentPullRequest>> PULL_REQUESTS_TYPE = new TypeReference<>() {};
    private static final TypeReference<Set<Deployment>> DEPLOYMENTS_TYPE = new TypeReference<>() {};

    @Id
    private UUID ticketId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private String branches;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private String commits;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "pull_requests", columnDefinition = "jsonb", nullable = false)
    private String pullRequests;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private String deployments;

    // Hibernate requires it
    protected DevelopmentActivityEntity() {}

    private DevelopmentActivityEntity(UUID ticketId, String branches, String commits, String pullRequests, String deployments) {
        this.ticketId = ticketId;
        this.branches = branches;
        this.commits = commits;
        this.pullRequests = pullRequests;
        this.deployments = deployments;
    }

    public static DevelopmentActivityEntity fromDomain(DevelopmentActivityAggregate activity) {
        DevelopmentActivitySnapshot snapshot = activity.toSnapshot();

        return new DevelopmentActivityEntity(
            snapshot.ticketId(),
            write(snapshot.branches()),
            write(snapshot.commits()),
            write(snapshot.pullRequests()),
            write(snapshot.deployments())
        );
    }

    public DevelopmentActivityAggregate toDomain() {
        return DevelopmentActivityAggregate.fromSnapshot(new DevelopmentActivitySnapshot(
            this.ticketId,
            read(this.branches, BRANCHES_TYPE),
            read(this.commits, COMMITS_TYPE),
            read(this.pullRequests, PULL_REQUESTS_TYPE),
            read(this.deployments, DEPLOYMENTS_TYPE)
        ));
    }

    private static String write(Object value) {
        try {
            return MAPPER.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize development activity", e);
        }
    }

    private static <T> T read(String json, TypeReference<T> type) {
        try {
            return MAPPER.readValue(json, type);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to deserialize development activity", e);
        }
    }
}
