package vantaCore.application.automationEngine.domain.policy;

import org.springframework.stereotype.Component;
import vantaCore.application.automationEngine.domain.AutomationEngineRuleSnapshot;
import vantaCore.application.automationEngine.domain.vo.ActionType;
import vantaCore.application.automationEngine.domain.vo.AutomationAction;
import vantaCore.application.automationEngine.domain.vo.AutomationCondition;
import vantaCore.application.automationEngine.domain.vo.TriggerType;
import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.project.domain.vo.CustomFieldDefinition;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.dto.NotificationCollection;
import vantaCore.application.shared.domain.policy.PolicyInterface;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/** field/fieldId references (condition.field, SET_FIELD_VALUE's fieldId, TICKET_FIELD_CHANGED's
 fieldId) are free-text strings, not enums - see AutomationCondition/AutomationAction. Real
 mistakes there (typo'd field id, a field deleted from the project after the rule was authored)
 would otherwise fail silently at execution time instead of at save time, so this validates every
 field/fieldId reference against the 4 built-in keys + this project's actual customFieldDefinitions. */
@Component
final public class UpsertAutomationEngineRulePolicy implements PolicyInterface<UpsertAutomationEngineRuleCheck> {

    private static final Set<String> BUILT_IN_FIELDS = Set.of("title", "priority", "status", "assignee");

    @Override
    public NotificationCollection check(UpsertAutomationEngineRuleCheck value) {
        NotificationCollection notifications = new NotificationCollection();

        AutomationEngineRuleSnapshot rule = value.rule().toSnapshot();
        ProjectAggregate project = value.project();

        Set<String> customFieldIds = project.getCustomFieldDefinitions().stream()
            .map(CustomFieldDefinition::id)
            .map(UUID::toString)
            .collect(Collectors.toSet());

        for (AutomationCondition condition : rule.conditions()) {
            if (!isKnownField(condition.field(), customFieldIds)) {
                notifications.append(unknownFieldNotification(condition.field()));
            }
        }

        String triggerFieldId = rule.trigger().type() == TriggerType.TICKET_FIELD_CHANGED
            ? rule.trigger().params().get("fieldId")
            : null;
        if (triggerFieldId != null && !customFieldIds.contains(triggerFieldId)) {
            notifications.append(unknownFieldNotification(triggerFieldId));
        }

        for (AutomationAction action : rule.actions()) {
            if (action.type() == ActionType.SET_FIELD_VALUE) {
                String fieldId = action.params().get("fieldId");
                if (fieldId == null || !customFieldIds.contains(fieldId)) {
                    notifications.append(unknownFieldNotification(fieldId));
                }
            }
        }

        return notifications;
    }

    private boolean isKnownField(String field, Set<String> customFieldIds) {
        return BUILT_IN_FIELDS.contains(field) || customFieldIds.contains(field);
    }

    private Notification unknownFieldNotification(String field) {
        return new Notification(
            "automation-engine-rule-unknown-field",
            "'" + field + "' is not a built-in ticket field or a custom field on this project",
            true
        );
    }
}
