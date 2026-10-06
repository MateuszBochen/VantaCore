package vantaCore.application.shared.infrastructure.csv;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Minimal hand-rolled RFC4180 reader/writer (no CSV library on the classpath, and the only two
 operations needed here - "parse an uploaded file into header-keyed rows" and "write one escaped
 row" - don't justify pulling one in) - handles quoted fields, embedded commas/quotes ("" escape)
 and embedded newlines inside a quoted field. */
public final class CsvSupport {

    private CsvSupport() {
    }

    /** First row is the header; every subsequent row becomes a Map keyed by that header, missing
     trailing cells default to "" rather than a shorter map, so callers can always look up every
     header key safely. */
    public static List<Map<String, String>> parse(InputStream input) {
        List<List<String>> table = parseRows(input);
        if (table.isEmpty()) {
            return List.of();
        }

        List<String> header = table.get(0);
        List<Map<String, String>> rows = new ArrayList<>();

        for (int i = 1; i < table.size(); i++) {
            List<String> row = table.get(i);
            Map<String, String> map = new LinkedHashMap<>();
            for (int col = 0; col < header.size(); col++) {
                map.put(header.get(col), col < row.size() ? row.get(col) : "");
            }
            rows.add(map);
        }

        return rows;
    }

    public static void writeRow(Writer writer, List<String> values) throws IOException {
        for (int i = 0; i < values.size(); i++) {
            if (i > 0) {
                writer.write(",");
            }
            writer.write(escape(values.get(i)));
        }
        writer.write("\r\n");
    }

    private static String escape(String value) {
        if (value == null) {
            return "";
        }

        boolean needsQuoting = value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r");
        if (!needsQuoting) {
            return value;
        }

        return "\"" + value.replace("\"", "\"\"") + "\"";
    }

    private static List<List<String>> parseRows(InputStream input) {
        List<List<String>> rows = new ArrayList<>();
        List<String> currentRow = new ArrayList<>();
        StringBuilder currentField = new StringBuilder();
        boolean inQuotes = false;
        boolean rowHasContent = false;

        try (InputStreamReader reader = new InputStreamReader(input, StandardCharsets.UTF_8)) {
            int c;
            while ((c = reader.read()) != -1) {
                char ch = (char) c;

                if (inQuotes) {
                    if (ch == '"') {
                        int next = reader.read();
                        if (next == '"') {
                            currentField.append('"');
                        } else {
                            inQuotes = false;
                            if (next == -1) {
                                break;
                            }
                            handleUnquotedChar((char) next, currentRow, currentField, rows);
                        }
                    } else {
                        currentField.append(ch);
                    }
                    continue;
                }

                rowHasContent = true;

                switch (ch) {
                    case '"' -> inQuotes = true;
                    case ',' -> {
                        currentRow.add(currentField.toString());
                        currentField.setLength(0);
                    }
                    case '\n' -> {
                        currentRow.add(currentField.toString());
                        currentField.setLength(0);
                        rows.add(currentRow);
                        currentRow = new ArrayList<>();
                        rowHasContent = false;
                    }
                    case '\r' -> {
                        // swallowed, \n (or EOF) closes the row
                    }
                    default -> currentField.append(ch);
                }
            }
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to read CSV content", exception);
        }

        if (rowHasContent || currentField.length() > 0 || !currentRow.isEmpty()) {
            currentRow.add(currentField.toString());
            rows.add(currentRow);
        }

        return rows;
    }

    // A quote-close can be immediately followed by another CSV control char with no explicit
    // "back in the main loop" step otherwise - reads one char ahead when closing a quote so that
    // char is handled with the same comma/newline/plain-char logic as the unquoted path, instead of
    // duplicating it inline at the close-quote site.
    private static void handleUnquotedChar(char ch, List<String> currentRow, StringBuilder currentField, List<List<String>> rows) {
        switch (ch) {
            case ',' -> {
                currentRow.add(currentField.toString());
                currentField.setLength(0);
            }
            case '\n' -> {
                currentRow.add(currentField.toString());
                currentField.setLength(0);
                rows.add(new ArrayList<>(currentRow));
                currentRow.clear();
            }
            case '\r' -> {
                // swallowed
            }
            default -> currentField.append(ch);
        }
    }
}
