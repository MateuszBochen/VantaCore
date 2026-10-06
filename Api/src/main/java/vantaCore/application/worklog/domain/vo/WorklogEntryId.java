package vantaCore.application.worklog.domain.vo;

import java.util.UUID;

public record WorklogEntryId(UUID value) {

    public static WorklogEntryId create() {
        return new WorklogEntryId(UUID.randomUUID());
    }

    public WorklogEntryId {
        if (value == null) {
            throw new IllegalArgumentException("WorklogEntryId cannot be null");
        }
    }

    @Override
    public String toString() {
        return this.value.toString();
    }
}
