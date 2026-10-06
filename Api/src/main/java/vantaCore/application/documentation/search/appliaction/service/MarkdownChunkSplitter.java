package vantaCore.application.documentation.search.appliaction.service;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/** Splits one markdown field into embedding-sized pieces - shared by DocumentationChunker
 (architectureOverview/api) and SubProjectDocumentationChunker (scope/impactAnalysis/
 solutionDesign/ADR content), so both sources chunk long-form text the same way.

 No overlap between adjacent chunks (v1 simplification) - split-by-heading already keeps each
 chunk topically coherent for typical doc lengths in this app. */
@Component
public class MarkdownChunkSplitter {

    private static final int MAX_CHUNK_CHARS = 1500;

    public List<String> split(String markdown) {
        if (markdown == null || markdown.isBlank()) {
            return List.of();
        }

        List<String> chunks = new ArrayList<>();
        for (String section : splitByHeadings(markdown)) {
            for (String piece : splitToMaxLength(section, MAX_CHUNK_CHARS)) {
                if (!piece.isBlank()) {
                    chunks.add(piece.strip());
                }
            }
        }

        return chunks;
    }

    // Each markdown heading line (any level) starts a new section, carrying its following text
    // with it - keeps a section's content grouped with the heading that names it.
    private List<String> splitByHeadings(String markdown) {
        String[] lines = markdown.split("\n");
        List<String> sections = new ArrayList<>();
        StringBuilder current = new StringBuilder();

        for (String line : lines) {
            if (line.startsWith("#") && !current.isEmpty()) {
                sections.add(current.toString());
                current = new StringBuilder();
            }
            current.append(line).append("\n");
        }

        if (!current.isEmpty()) {
            sections.add(current.toString());
        }

        return sections;
    }

    // Paragraph-boundary sliding window - a section over maxChars is split on blank lines rather
    // than a hard character cutoff, so a chunk never ends mid-sentence.
    private List<String> splitToMaxLength(String text, int maxChars) {
        if (text.length() <= maxChars) {
            return List.of(text);
        }

        List<String> parts = new ArrayList<>();
        StringBuilder current = new StringBuilder();

        for (String paragraph : text.split("\n\n")) {
            if (!current.isEmpty() && current.length() + paragraph.length() > maxChars) {
                parts.add(current.toString());
                current = new StringBuilder();
            }
            current.append(paragraph).append("\n\n");
        }

        if (!current.isEmpty()) {
            parts.add(current.toString());
        }

        return parts;
    }
}
