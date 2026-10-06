package vantaCore.application.release.appliaction.dto;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;
import java.time.LocalDate;

// Reads an ISO date ("2026-09-30") or, for an unset planned release date, an empty/blank string,
// which the frontend sends verbatim ('') - the default LocalDate deserializer would throw on that.
// Same "blank string means absent" handling as FlexibleLocalDateTimeDeserializer in worklog.
final public class EmptyableLocalDateDeserializer extends JsonDeserializer<LocalDate> {

    @Override
    public LocalDate deserialize(JsonParser parser, DeserializationContext context) throws IOException {
        String value = parser.getValueAsString();
        if (value == null || value.isBlank()) {
            return null;
        }

        return LocalDate.parse(value.trim());
    }
}
