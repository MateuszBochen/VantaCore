package vantaCore.ui.http.rest.controller.worklog;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.exception.UnprocessableEntityException;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.application.worklog.appliaction.query.listMyWorklog.ListMyWorklogQuery;
import vantaCore.application.worklog.appliaction.query.listMyWorklog.MyWorklogResult;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Many;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/worklog")
final public class MyWorklogController {

    private final QueryBusInterface queryBus;

    MyWorklogController(QueryBusInterface queryBus) {
        this.queryBus = queryBus;
    }

    @GetMapping("/mine")
    public OpenApiResponse<Many<MyWorklogResult>> listMyWorklog(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
        // Comma-separated. Absent = report for the caller only (unchanged default); the frontend
        // supplies whichever user(s) the report should cover otherwise.
        @RequestParam(required = false) String userIds,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "50") int limit
    ) throws Exception {

        ListMyWorklogQuery query = new ListMyWorklogQuery(startDate, endDate, parseUuidList(userIds), page, limit);
        Collection<MyWorklogResult> result = this.queryBus.ask(query);

        return OpenApiResponse.many(result, HttpStatus.OK);
    }

    private Set<UUID> parseUuidList(String value) {
        if (value == null || value.isBlank()) {
            return Set.of();
        }

        Set<UUID> result = new HashSet<>();
        for (String id : value.split(",")) {
            try {
                result.add(UUID.fromString(id.trim()));
            } catch (IllegalArgumentException exception) {
                throw new UnprocessableEntityException(List.of(new Notification(
                    "invalid-id",
                    "'" + id.trim() + "' is not a valid id",
                    true
                )));
            }
        }

        return result;
    }
}
