package vantaCore.ui.http.rest.controller.project;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import vantaCore.application.shared.domain.accessControl.Resource;
import vantaCore.application.shared.infrastructure.security.ResourceAuthorizationChecker;
import vantaCore.application.ticket.appliaction.export.TicketExportService;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

// Same joinOrUndefined comma-separated id convention as /api/search (types/statusIds) - parsed by
// hand rather than going through the command/query bus, since a streaming binary response doesn't
// fit the Item<T>/Collection<T> QueryResult envelope (see TicketExportService).
@RestController
@RequestMapping("/api/project/{projectId}/ticket/export")
final public class TicketExportController {

    private final TicketExportService exportService;
    private final ResourceAuthorizationChecker authorizationChecker;

    TicketExportController(TicketExportService exportService, ResourceAuthorizationChecker authorizationChecker) {
        this.exportService = exportService;
        this.authorizationChecker = authorizationChecker;
    }

    @GetMapping
    public ResponseEntity<StreamingResponseBody> exportCsv(
        @PathVariable UUID projectId,
        @RequestParam(required = false) String types,
        @RequestParam(required = false) String statusIds
    ) {
        this.authorizationChecker.assertGranted(Resource.EXPORT_VIEW);

        Set<UUID> issueTypeIds = parseUuidList(types);
        Set<UUID> statuses = parseUuidList(statusIds);

        StreamingResponseBody body = output -> this.exportService.writeCsv(projectId, issueTypeIds, statuses, output);

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("text/csv"))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"tickets-export.csv\"")
            .body(body);
    }

    @GetMapping("/full")
    public ResponseEntity<StreamingResponseBody> exportFull(
        @PathVariable UUID projectId,
        @RequestParam(required = false) String types,
        @RequestParam(required = false) String statusIds
    ) {
        this.authorizationChecker.assertGranted(Resource.EXPORT_VIEW);

        Set<UUID> issueTypeIds = parseUuidList(types);
        Set<UUID> statuses = parseUuidList(statusIds);

        StreamingResponseBody body = output -> this.exportService.writeFullExport(projectId, issueTypeIds, statuses, output);

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("application/zip"))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"tickets-export.zip\"")
            .body(body);
    }

    private Set<UUID> parseUuidList(String value) {
        if (value == null || value.isBlank()) {
            return Set.of();
        }

        Set<UUID> result = new HashSet<>();
        for (String id : value.split(",")) {
            result.add(UUID.fromString(id.trim()));
        }
        return result;
    }
}
