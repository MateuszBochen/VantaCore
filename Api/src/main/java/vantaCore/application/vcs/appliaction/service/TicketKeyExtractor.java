package vantaCore.application.vcs.appliaction.service;

import org.springframework.stereotype.Component;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** {project.prefix}-\d+ regex, run against branch names / commit messages / PR titles+descriptions -
 see the "inbound webhook, not scheduled polling" ADR: plain regex, deliberately no fuzzy/NLP
 matching. All matches are returned, not just the first - a single commit message or PR description
 can legitimately reference more than one ticket (e.g. "Fixes ABC-1 and ABC-2"). */
@Component
public class TicketKeyExtractor {

    public Set<String> extract(String text, String projectPrefix) {
        if (text == null || text.isBlank() || projectPrefix == null || projectPrefix.isBlank()) {
            return Set.of();
        }

        Pattern pattern = Pattern.compile(Pattern.quote(projectPrefix) + "-\\d+");
        Matcher matcher = pattern.matcher(text);

        Set<String> keys = new LinkedHashSet<>();
        while (matcher.find()) {
            keys.add(matcher.group());
        }

        return keys;
    }
}
