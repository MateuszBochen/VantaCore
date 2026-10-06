package vantaCore.application.userSettings.infrastructure.persistence.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import vantaCore.application.userSettings.domain.UserSettingsAggregate;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "user_settings")
public class UserSettingsEntity {

    // Values here are always plain JSON-decoded types (String/Number/Boolean/Map/List/null, never
    // java.time.*) since `settings` is exactly whatever the frontend PUT its raw JSON body as - a
    // bare ObjectMapper is safe here, unlike DevelopmentActivityEntity's jsonb columns which store
    // typed domain VOs with real Instant fields.
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<Map<String, Object>> SETTINGS_TYPE = new TypeReference<>() {};

    @Id
    private UUID userId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private String settings;

    private Instant updatedAt;

    // Hibernate requires it
    protected UserSettingsEntity() {}

    private UserSettingsEntity(UUID userId, String settings, Instant updatedAt) {
        this.userId = userId;
        this.settings = settings;
        this.updatedAt = updatedAt;
    }

    public static UserSettingsEntity fromDomain(UserSettingsAggregate aggregate, Instant updatedAt) {
        return new UserSettingsEntity(aggregate.getUserId(), writeJson(aggregate.getSettings()), updatedAt);
    }

    public UserSettingsAggregate toDomain() {
        return UserSettingsAggregate.of(this.userId, readJson(this.settings));
    }

    private static String writeJson(Object value) {
        try {
            return MAPPER.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize user settings", e);
        }
    }

    private static Map<String, Object> readJson(String json) {
        try {
            return MAPPER.readValue(json, SETTINGS_TYPE);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to deserialize user settings", e);
        }
    }
}
