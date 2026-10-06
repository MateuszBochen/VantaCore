package vantaCore.application.importExport.domain.mapping;

import java.util.Locale;
import java.util.Map;

/** Raw source priority -> VantaCore's fixed priority level (0 = Highest ... 4 = Lowest, the same
 scale for every project). Resolved automatically, no per-value mapping step, since the scale is
 fixed and the common source vocabularies line up with it:
 - names, case-insensitive: Highest/High/Medium/Low/Lowest (Jira's current defaults, and CSV), plus
   classic Jira's Blocker/Critical/Major/Minor/Trivial on the same five steps;
 - numbers 0-4 as-is. That also covers Azure DevOps' Priority field (1-4, default 2): its 1 = our
   High, 2 = Medium, 3 = Low, 4 = Lowest, so DevOps' default lands on our Medium.
 Anything else - or the field not being mapped/present at all - falls back to DEFAULT (Medium),
 so an import never creates tickets without a priority. */
public final class PriorityMapping {

    public static final int DEFAULT = 2;

    private static final Map<String, Integer> NAMES = Map.ofEntries(
        Map.entry("highest", 0),
        Map.entry("blocker", 0),
        Map.entry("high", 1),
        Map.entry("critical", 1),
        Map.entry("medium", 2),
        Map.entry("major", 2),
        Map.entry("low", 3),
        Map.entry("minor", 3),
        Map.entry("lowest", 4),
        Map.entry("trivial", 4)
    );

    private PriorityMapping() {
    }

    public static int fromSourceValue(String value) {
        if (value == null || value.isBlank()) {
            return DEFAULT;
        }

        String normalized = value.trim().toLowerCase(Locale.ROOT);
        Integer byName = NAMES.get(normalized);
        if (byName != null) {
            return byName;
        }

        try {
            double number = Double.parseDouble(normalized);
            if (number == Math.rint(number) && number >= 0 && number <= 4) {
                return (int) number;
            }
        } catch (NumberFormatException exception) {
            // not a number - falls through to the default
        }

        return DEFAULT;
    }
}
