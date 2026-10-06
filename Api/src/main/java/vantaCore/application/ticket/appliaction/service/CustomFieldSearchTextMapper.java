package vantaCore.application.ticket.appliaction.service;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.vo.CustomFieldDefinition;
import vantaCore.application.user.domain.UserAggregate;
import vantaCore.application.user.domain.repository.UserAggregateRepositoryInterface;
import vantaCore.application.user.domain.vo.UserId;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/** Flattens a ticket's custom field values into plain searchable text (backs
 tickets.custom_fields_search_text - see V25__add_search_vectors.sql). A pure SQL generated column
 can't do this: SELECT values are already plain label strings (fine as-is), but USER values need a
 name lookup that only the application layer can do. */
@Component
public class CustomFieldSearchTextMapper {

    private final UserAggregateRepositoryInterface userRepository;

    public CustomFieldSearchTextMapper(UserAggregateRepositoryInterface userRepository) {
        this.userRepository = userRepository;
    }

    public String map(Map<String, Object> customFields, Set<CustomFieldDefinition> definitions) {
        if (customFields == null || customFields.isEmpty()) {
            return "";
        }

        Map<String, CustomFieldDefinition> definitionsById = definitions.stream()
            .collect(Collectors.toMap(definition -> definition.id().toString(), definition -> definition));

        return customFields.entrySet().stream()
            .map(entry -> toText(definitionsById.get(entry.getKey()), entry.getValue()))
            .filter(text -> !text.isBlank())
            .collect(Collectors.joining(" "));
    }

    private String toText(CustomFieldDefinition definition, Object value) {
        // A field id with no matching definition (deleted/stale) has nothing to format against -
        // skip it, same "best effort, don't fail the save" stance as the user-lookup fallback below.
        if (definition == null || value == null) {
            return "";
        }

        return switch (definition.type()) {
            case USER -> resolveUserNames(value);
            case CHECKBOX -> isTruthy(value) ? "tak" : "nie";
            case SELECT, TEXT, NUMBER, DATE, TIME, DATETIME -> flattenValue(value);
        };
    }

    private boolean isTruthy(Object value) {
        return value instanceof Boolean bool ? bool : Boolean.parseBoolean(String.valueOf(value));
    }

    private String resolveUserNames(Object value) {
        return flattenRawValues(value).stream()
            .map(this::resolveUserName)
            .filter(name -> !name.isBlank())
            .collect(Collectors.joining(" "));
    }

    // Best-effort: a custom field's stored user id can go stale (nothing enforces referential
    // integrity on a jsonb value) - skip it rather than failing the whole ticket save.
    private String resolveUserName(String rawUserId) {
        try {
            UserAggregate user = this.userRepository.findById(new UserId(UUID.fromString(rawUserId)));
            return user.getProfile().firstName() + " " + user.getProfile().lastName();
        } catch (RuntimeException exception) {
            return "";
        }
    }

    private String flattenValue(Object value) {
        return String.join(" ", flattenRawValues(value));
    }

    // A `multiple` field stores a List, a single-valued one stores a scalar - normalize both rather
    // than branching on CustomFieldDefinition.multiple().
    private List<String> flattenRawValues(Object value) {
        if (value instanceof List<?> list) {
            return list.stream().map(String::valueOf).toList();
        }

        return List.of(String.valueOf(value));
    }
}
