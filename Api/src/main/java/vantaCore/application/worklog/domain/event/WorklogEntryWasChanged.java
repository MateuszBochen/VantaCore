package vantaCore.application.worklog.domain.event;

import vantaCore.application.worklog.domain.WorklogEntrySnapshot;

/** Fired for both a brand-new entry (LogWorklogCommandHandler) and a correction to an existing one
 (UpdateWorklogCommandHandler) - listeners that just need "this worklog entry's current state" don't
 care which one happened, so both dispatch the same event rather than two near-identical ones. */
public record WorklogEntryWasChanged(WorklogEntrySnapshot entry) {
}
