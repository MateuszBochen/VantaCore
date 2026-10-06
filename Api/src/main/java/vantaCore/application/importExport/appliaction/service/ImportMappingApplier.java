package vantaCore.application.importExport.appliaction.service;

import org.springframework.stereotype.Component;
import vantaCore.application.importExport.domain.mapping.FieldMapping;
import vantaCore.application.importExport.domain.mapping.PriorityMapping;
import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.user.domain.repository.UserAggregateRepositoryInterface;
import vantaCore.application.user.domain.vo.Email;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/** Turns one source record's raw field map into ticket-shaped values, shared by every provider
 (CSV rows and ExternalImportSourceInterface records both expose the same Map<String,String> field
 shape) - see ImportJobRunner. */
@Component
public class ImportMappingApplier {

    private static final String CUSTOM_FIELD_PREFIX = "custom:";

    private final UserAggregateRepositoryInterface userRepository;

    public ImportMappingApplier(UserAggregateRepositoryInterface userRepository) {
        this.userRepository = userRepository;
    }

    public AppliedFields apply(
        Map<String, String> sourceFields,
        List<FieldMapping> mappings,
        Map<String, UUID> valueMap,
        ProjectAggregate project
    ) {
        String title = null;
        String description = null;
        UUID issueTypeId = null;
        UUID statusId = null;
        // Medium unless a mapped source value says otherwise - see PriorityMapping.
        int priority = PriorityMapping.DEFAULT;
        List<UUID> assigneeIds = new ArrayList<>();
        Map<String, Object> customFields = new LinkedHashMap<>();

        for (FieldMapping mapping : mappings) {
            String sourceValue = sourceFields.get(mapping.sourceField());
            if (sourceValue == null || mapping.targetField() == null) {
                continue;
            }

            String target = mapping.targetField();

            if (target.startsWith(CUSTOM_FIELD_PREFIX)) {
                customFields.put(target.substring(CUSTOM_FIELD_PREFIX.length()), sourceValue);
                continue;
            }

            switch (target) {
                case "title" -> title = sourceValue;
                case "description" -> description = sourceValue;
                // issueType/status source values are resolved through valueMappings (raw source
                // string -> IssueType.id/Status.id) first - see ValueMapping's javadoc. Only when
                // the user left a value unmapped (e.g. it never showed up in the preview rows) does
                // it fall back to a same-name issue type/status of the target project.
                case "issueType" -> issueTypeId = Optional.ofNullable(valueMap.get(sourceValue))
                    .or(() -> project.findIssueTypeIdByName(sourceValue))
                    .orElse(null);
                case "status" -> statusId = Optional.ofNullable(valueMap.get(sourceValue))
                    .or(() -> project.findStatusIdByName(sourceValue))
                    .orElse(null);
                case "priority" -> priority = PriorityMapping.fromSourceValue(sourceValue);
                // Matched by email against existing users, not valueMappings - an unmatched or
                // malformed email just leaves the ticket unassigned (see this sub-project's scope).
                case "assignee" -> resolveAssignee(sourceValue).ifPresent(assigneeIds::add);
                default -> {
                    // Unknown target field - ignored rather than failing the row, same
                    // forward-compatibility stance as everywhere else free-text field ids are used.
                }
            }
        }

        // Status unmapped or unmatched - start from the issue type's initial status, same as the
        // value-mapping UI promises ("Uses the issue type's initial status"), instead of skipping.
        if (statusId == null && issueTypeId != null) {
            statusId = project.findInitialStatusId(issueTypeId).orElse(null);
        }

        return new AppliedFields(title, description, issueTypeId, statusId, priority, assigneeIds, customFields);
    }

    private Optional<UUID> resolveAssignee(String email) {
        try {
            return this.userRepository.findByEmail(new Email(email)).map(user -> user.getId().value());
        } catch (IllegalArgumentException exception) {
            return Optional.empty();
        }
    }

    public record AppliedFields(
        String title,
        String description,
        UUID issueTypeId,
        UUID statusId,
        int priority,
        List<UUID> assigneeIds,
        Map<String, Object> customFields
    ) {
    }
}
