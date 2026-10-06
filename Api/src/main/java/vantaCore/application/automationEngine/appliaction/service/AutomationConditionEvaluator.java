package vantaCore.application.automationEngine.appliaction.service;

import org.springframework.stereotype.Component;
import vantaCore.application.automationEngine.domain.vo.AutomationCondition;
import vantaCore.application.automationEngine.domain.vo.ConditionOperator;
import vantaCore.application.ticket.domain.TicketSnapshot;

import java.util.Arrays;
import java.util.Collection;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/** No type-aware parsing (numeric/date comparison) - condition.value is always a raw string on the
 wire, and the only operators v1 supports (equals/notEquals/in/isEmpty) are all satisfied by plain
 string/set-membership comparison. A ">"-style operator would need type-aware parsing; none exists
 yet. */
@Component
public class AutomationConditionEvaluator {

    // AND semantics - every condition must match for the rule to fire. Not explicitly stated in the
    // contract, but the only sensible default for a plain list of conditions with no explicit
    // combinator (same assumption every comparable rule engine, incl. Jira Automation, makes).
    public boolean matches(Iterable<AutomationCondition> conditions, TicketSnapshot ticket) {
        for (AutomationCondition condition : conditions) {
            if (!evaluate(condition, ticket)) {
                return false;
            }
        }
        return true;
    }

    private boolean evaluate(AutomationCondition condition, TicketSnapshot ticket) {
        Object rawValue = resolveFieldValue(condition.field(), ticket);

        if (rawValue instanceof Collection<?> collection) {
            return evaluateCollection(collection, condition.operator(), condition.value());
        }

        return evaluateScalar(rawValue, condition.operator(), condition.value());
    }

    // "title"/"priority"/"status"/"assignee" are the 4 built-in synthetic keys (see
    // AutomationCondition's javadoc); anything else is a customFieldDefinition id, read straight
    // out of the ticket's raw customFields map.
    private Object resolveFieldValue(String field, TicketSnapshot ticket) {
        return switch (field) {
            case "title" -> ticket.title();
            case "priority" -> ticket.priority();
            case "status" -> ticket.statusId() != null ? ticket.statusId().toString() : null;
            case "assignee" -> ticket.assigneeIds().stream().map(UUID::toString).collect(Collectors.toSet());
            default -> ticket.customFields().get(field);
        };
    }

    private boolean evaluateCollection(Collection<?> collection, ConditionOperator operator, String value) {
        Set<String> values = collection.stream().map(String::valueOf).collect(Collectors.toSet());

        return switch (operator) {
            case IS_EMPTY -> values.isEmpty();
            case EQUALS -> value != null && values.contains(value);
            case NOT_EQUALS -> value == null || !values.contains(value);
            case IN -> splitCommaList(value).stream().anyMatch(values::contains);
        };
    }

    private boolean evaluateScalar(Object rawValue, ConditionOperator operator, String value) {
        String stringValue = rawValue == null ? null : String.valueOf(rawValue);

        return switch (operator) {
            case IS_EMPTY -> stringValue == null || stringValue.isBlank();
            case EQUALS -> Objects.equals(stringValue, value);
            case NOT_EQUALS -> !Objects.equals(stringValue, value);
            case IN -> stringValue != null && splitCommaList(value).contains(stringValue);
        };
    }

    private Set<String> splitCommaList(String value) {
        if (value == null || value.isBlank()) {
            return Set.of();
        }

        return Arrays.stream(value.split(","))
            .map(String::trim)
            .filter(part -> !part.isEmpty())
            .collect(Collectors.toSet());
    }
}
