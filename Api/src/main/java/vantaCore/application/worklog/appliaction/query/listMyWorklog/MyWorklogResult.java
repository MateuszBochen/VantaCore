package vantaCore.application.worklog.appliaction.query.listMyWorklog;

import vantaCore.application.worklog.appliaction.query.listWorklog.WorklogActorResult;

import java.time.LocalDateTime;
import java.util.UUID;

public record MyWorklogResult(
    UUID id,
    int minutes,
    LocalDateTime date,
    String note,
    WorklogActorResult actor,
    MyWorklogTicketResult ticket,
    MyWorklogProjectResult project
) {
}
