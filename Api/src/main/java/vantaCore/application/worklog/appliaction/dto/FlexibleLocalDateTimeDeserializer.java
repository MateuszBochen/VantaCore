package vantaCore.application.worklog.appliaction.dto;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;

// Accepts either a full ISO-8601 datetime ("2026-08-19T10:30:00") or a bare date
// ("2026-08-19"), the latter still being what some older frontend call sites send. A bare date is
// stamped with the current time rather than midnight, so "logged today with no time given" reads
// as "logged just now", not "logged at 00:00".
final public class FlexibleLocalDateTimeDeserializer extends JsonDeserializer<LocalDateTime> {

    @Override
    public LocalDateTime deserialize(JsonParser parser, DeserializationContext context) throws IOException {
        String value = parser.getValueAsString();
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return LocalDateTime.parse(value);
        } catch (DateTimeParseException exception) {
            return LocalDate.parse(value).atTime(LocalTime.now());
        }
    }
}
