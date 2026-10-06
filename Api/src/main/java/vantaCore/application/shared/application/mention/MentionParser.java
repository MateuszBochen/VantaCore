package vantaCore.application.shared.application.mention;

import org.springframework.stereotype.Component;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Extracts @mention user ids out of free text (comment body, ticket description) - the frontend's
 rich-text editor serializes a mention as a markdown-link-shaped token, e.g.
 "[@backen backen](mention:6fa026f8-f15e-4f52-b096-f99f1ed80d68)" (see Front's
 MarkdownEditor/tiptap/UserMentionExtension). Only the id is trusted here - the display label is
 client-controlled text and re-derived from the user record by whoever consumes the parsed id. */
@Component
public class MentionParser {

    private static final Pattern MENTION_PATTERN = Pattern.compile(
        "\\[@[^]]*]\\(mention:([0-9a-fA-F-]{36})\\)"
    );

    public Set<UUID> parseMentionedUserIds(String text) {
        if (text == null || text.isBlank()) {
            return Set.of();
        }

        Set<UUID> mentionedUserIds = new LinkedHashSet<>();
        Matcher matcher = MENTION_PATTERN.matcher(text);

        while (matcher.find()) {
            try {
                mentionedUserIds.add(UUID.fromString(matcher.group(1)));
            } catch (IllegalArgumentException ignored) {
                // Malformed id inside otherwise mention-shaped syntax - skip it rather than fail
                // parsing the rest of the text over one bad token.
            }
        }

        return mentionedUserIds;
    }
}
