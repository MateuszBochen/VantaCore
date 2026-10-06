package vantaCore.application.accessToken.infrastructure.persistence.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import vantaCore.application.accessToken.domain.PersonalAccessTokenAggregate;
import vantaCore.application.accessToken.domain.vo.AccessTokenId;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "personal_access_tokens")
public class PersonalAccessTokenEntity {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<List<String>> CODES_TYPE = new TypeReference<>() {};

    @Id
    private UUID id;

    private UUID userId;
    private String name;
    private String tokenHash;
    private String tokenPrefix;

    // Resource codes, not enum names - same wire form as everywhere else Resource is persisted.
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private String resources;

    private Instant createdAt;
    private Instant expiresAt;
    private Instant lastUsedAt;

    // Hibernate requires it
    protected PersonalAccessTokenEntity() {}

    public static PersonalAccessTokenEntity fromDomain(PersonalAccessTokenAggregate token) {
        PersonalAccessTokenEntity entity = new PersonalAccessTokenEntity();
        entity.id = token.getId().value();
        entity.userId = token.getUserId();
        entity.name = token.getName();
        entity.tokenHash = token.getTokenHash();
        entity.tokenPrefix = token.getTokenPrefix();
        entity.resources = writeCodes(token.getScopes());
        entity.createdAt = token.getCreatedAt();
        entity.expiresAt = token.getExpiresAt();
        entity.lastUsedAt = token.getLastUsedAt();
        return entity;
    }

    public PersonalAccessTokenAggregate toDomain() {
        return PersonalAccessTokenAggregate.restore(
            new AccessTokenId(this.id), this.userId, this.name, this.tokenHash, this.tokenPrefix,
            readCodes(this.resources), this.createdAt, this.expiresAt, this.lastUsedAt
        );
    }

    private static String writeCodes(Set<Resource> scopes) {
        try {
            return MAPPER.writeValueAsString(scopes.stream().map(Resource::getCode).sorted().toList());
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize access token resources", exception);
        }
    }

    // A code that's no longer a Resource is dropped - the token then simply can't use it anymore.
    private static Set<Resource> readCodes(String json) {
        Set<Resource> scopes = EnumSet.noneOf(Resource.class);
        try {
            for (String code : MAPPER.readValue(json, CODES_TYPE)) {
                try {
                    scopes.add(Resource.fromCode(code));
                } catch (IllegalArgumentException exception) {
                    // stale code
                }
            }
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to deserialize access token resources", exception);
        }
        return scopes;
    }
}
