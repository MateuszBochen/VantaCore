package vantaCore.ui.http.rest.controller.project;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.auditLog.appliaction.query.listAuditLog.AuditLogEntryResult;
import vantaCore.application.auditLog.appliaction.query.listAuditLog.ListAuditLogQuery;
import vantaCore.application.auditLog.domain.AuditAction;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.application.shared.domain.audit.AuditResourceType;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Many;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/project/{projectId}/audit-log")
final public class AuditLogController {

    private final QueryBusInterface queryBus;

    AuditLogController(QueryBusInterface queryBus) {
        this.queryBus = queryBus;
    }

    @GetMapping
    public OpenApiResponse<Many<AuditLogEntryResult>> listAuditLog(
        @PathVariable UUID projectId,
        @RequestParam(required = false) UUID actorId,
        @RequestParam(required = false) AuditResourceType resourceType,
        @RequestParam(required = false) AuditAction action,
        @RequestParam(required = false) Instant from,
        @RequestParam(required = false) Instant till,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "30") int limit
    ) throws Exception {

        ListAuditLogQuery query = new ListAuditLogQuery(projectId, actorId, resourceType, action, from, till, page, limit);
        Collection<AuditLogEntryResult> result = this.queryBus.ask(query);

        return OpenApiResponse.many(result, HttpStatus.OK);
    }
}
