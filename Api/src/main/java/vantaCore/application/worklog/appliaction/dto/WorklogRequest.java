package vantaCore.application.worklog.appliaction.dto;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

final public class WorklogRequest {

    @NotNull
    @Min(1)
    private final Integer minutes;

    // Accepts a bare date too (see FlexibleLocalDateTimeDeserializer) - older frontend call sites
    // still send just a date, which gets stamped with the current time rather than midnight.
    @NotNull
    @JsonDeserialize(using = FlexibleLocalDateTimeDeserializer.class)
    private final LocalDateTime date;

    private final String note;

    public WorklogRequest(Integer minutes, LocalDateTime date, String note) {
        this.minutes = minutes;
        this.date = date;
        this.note = note;
    }

    public Integer getMinutes() {
        return minutes;
    }

    public LocalDateTime getDate() {
        return date;
    }

    public String getNote() {
        return note;
    }
}
