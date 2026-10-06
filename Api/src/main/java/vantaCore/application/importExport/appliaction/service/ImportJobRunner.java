package vantaCore.application.importExport.appliaction.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import vantaCore.application.comment.appliaction.command.addComment.AddCommentCommand;
import vantaCore.application.comment.appliaction.dto.CommentRequest;
import vantaCore.application.file.appliaction.command.uploadTicketAttachment.UploadTicketAttachmentCommand;
import vantaCore.application.file.appliaction.dto.FileUploadPayload;
import vantaCore.application.importExport.domain.ImportConnectionSnapshot;
import vantaCore.application.importExport.domain.ImportJobAggregate;
import vantaCore.application.importExport.domain.mapping.FieldMapping;
import vantaCore.application.importExport.domain.repository.ImportConnectionRepositoryInterface;
import vantaCore.application.importExport.domain.repository.ImportJobRepositoryInterface;
import vantaCore.application.importExport.domain.source.ExternalImportSourceInterface;
import vantaCore.application.importExport.domain.source.ImportSourceAttachment;
import vantaCore.application.importExport.domain.source.ImportLinkType;
import vantaCore.application.importExport.domain.source.ImportSourceComment;
import vantaCore.application.importExport.domain.source.ImportSourceLink;
import vantaCore.application.importExport.domain.source.ImportSourcePage;
import vantaCore.application.importExport.domain.source.ImportSourceRecord;
import vantaCore.application.importExport.domain.vo.ImportConnectionId;
import vantaCore.application.importExport.domain.vo.ImportJobId;
import vantaCore.application.importExport.domain.vo.ImportProvider;
import vantaCore.application.importExport.domain.vo.ImportReport;
import vantaCore.application.importExport.domain.vo.ImportRowOutcome;
import vantaCore.application.importExport.domain.vo.ImportRowResult;
import vantaCore.application.importExport.infrastructure.security.ImportJobSecurityContext;
import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.infrastructure.csv.CsvSupport;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.exception.ClientException;
import vantaCore.application.ticket.appliaction.command.propagateProgress.PropagateProgressCommand;
import vantaCore.application.ticket.appliaction.command.upsertTicket.UpsertTicketCommand;
import vantaCore.application.ticket.appliaction.dto.RelatedTicketRequest;
import vantaCore.application.ticket.appliaction.dto.UpsertTicketRequest;
import vantaCore.application.ticket.domain.TicketSnapshot;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketRelation;
import vantaCore.application.ticket.domain.vo.TicketRelationType;
import vantaCore.application.ticket.domain.vo.TicketId;

import java.io.ByteArrayInputStream;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Executor;
import java.util.function.UnaryOperator;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Runs a whole import job on a background thread - see the "Import runs as an async background
 job" ADR. CSV and JIRA/AZURE_DEVOPS share everything past "get a Map<String,String> of raw source
 fields plus its attachments" (see ImportMappingApplier), they only differ in how records are
 produced (CsvSupport.parse for CSV, ExternalImportSourceInterface.fetchPage paginated for the
 other two). */
@Component
public class ImportJobRunner {

    private static final Logger log = LoggerFactory.getLogger(ImportJobRunner.class);
    private static final int PROGRESS_EVERY_ROWS = 25;
    // External imports run in two passes (tickets, then their parent/relation links - see
    // linkTickets), so the first pass only fills progress up to here and the second the rest.
    private static final int FIRST_PASS_PROGRESS_CEILING = 90;
    private static final Pattern BLANK_LINES = Pattern.compile("\\n{3,}");
    private static final Pattern ATTACHMENT_IMAGE_MARKER = Pattern.compile("\\{\\{ATTACHMENT_IMAGE:(\\d+):([^}]*)}}");

    private final ImportJobRepositoryInterface jobRepository;
    private final ImportConnectionRepositoryInterface connectionRepository;
    private final ExternalImportSourceRegistry sourceRegistry;
    private final ImportMappingApplier mappingApplier;
    private final TicketAggregateRepositoryInterface ticketRepository;
    private final ProjectAggregateRepositoryInterface projectRepository;
    private final CommandBusInterface commandBus;
    private final Executor importExecutor;

    public ImportJobRunner(
        ImportJobRepositoryInterface jobRepository,
        ImportConnectionRepositoryInterface connectionRepository,
        ExternalImportSourceRegistry sourceRegistry,
        ImportMappingApplier mappingApplier,
        TicketAggregateRepositoryInterface ticketRepository,
        ProjectAggregateRepositoryInterface projectRepository,
        // Not @Lazy: this bean is reachable from StartImportQueryHandler, one of QueryBus's eagerly
        // collected handlers - not CommandBus's. No CommandHandlerInterface anywhere injects
        // QueryBusInterface (verified), so CommandBus's own construction never needs QueryBus back -
        // QueryBus -> ... -> CommandBus is one-directional, unlike the genuine CommandBus<->EventBus
        // cycle @Lazy exists for elsewhere.
        CommandBusInterface commandBus,
        @Qualifier("importExecutor") Executor importExecutor
    ) {
        this.jobRepository = jobRepository;
        this.connectionRepository = connectionRepository;
        this.sourceRegistry = sourceRegistry;
        this.mappingApplier = mappingApplier;
        this.ticketRepository = ticketRepository;
        this.projectRepository = projectRepository;
        this.commandBus = commandBus;
        this.importExecutor = importExecutor;
    }

    public void runAsync(
        ImportJobId jobId,
        UUID projectId,
        UUID startedByUserId,
        ImportProvider provider,
        UUID connectionId,
        byte[] csvContent,
        List<FieldMapping> mappings,
        Map<String, UUID> valueMap
    ) {
        this.importExecutor.execute(() -> ImportJobSecurityContext.runAs(
            startedByUserId,
            () -> run(jobId, projectId, provider, connectionId, csvContent, mappings, valueMap)
        ));
    }

    private void run(
        ImportJobId jobId,
        UUID projectId,
        ImportProvider provider,
        UUID connectionId,
        byte[] csvContent,
        List<FieldMapping> mappings,
        Map<String, UUID> valueMap
    ) {
        markRunning(jobId);

        List<ImportRowResult> rows = new ArrayList<>();
        Counters counters = new Counters();

        try {
            // Loaded once per job, not per row - only read for the issue type/status name fallback
            // in ImportMappingApplier (a read-only cross-module lookup, see CLAUDE.md).
            ProjectAggregate project = this.projectRepository.findById(new ProjectId(projectId))
                .orElseThrow(() -> new IllegalStateException("Project no longer exists"));

            log.info(
                "Import job {} started: provider={}, fieldMappings={}, valueMappings={}, projectIssueTypes={}",
                jobId, provider, mappings, valueMap.keySet(),
                project.getIssueTypes().stream().map(issueType -> issueType.name()).toList()
            );

            if (provider == ImportProvider.CSV) {
                runCsv(jobId, project, csvContent, mappings, valueMap, rows, counters);
            } else {
                runExternal(jobId, project, provider, connectionId, mappings, valueMap, rows, counters);
            }

            ImportReport report = counters.toReport(rows);
            saveJob(job -> job.withCompleted(report, Instant.now()), jobId);
        } catch (Exception exception) {
            log.error("Import job {} failed", jobId, exception);
            ImportReport partial = counters.toReport(rows);
            saveJob(job -> job.withFailed(partial, Instant.now()), jobId);
        }
    }

    private void runCsv(
        ImportJobId jobId,
        ProjectAggregate project,
        byte[] csvContent,
        List<FieldMapping> mappings,
        Map<String, UUID> valueMap,
        List<ImportRowResult> rows,
        Counters counters
    ) {
        List<Map<String, String>> records = CsvSupport.parse(new ByteArrayInputStream(csvContent));
        int total = records.size();
        int rowNumber = 0;

        for (Map<String, String> fields : records) {
            rowNumber++;
            ImportRowResult result = processRow(rowNumber, fields, List.of(), List.of(), List.of(), mappings, valueMap, project, null, null, counters).result();
            rows.add(result);
            updateProgress(jobId, rowNumber, total);
        }
    }

    private void runExternal(
        ImportJobId jobId,
        ProjectAggregate project,
        ImportProvider provider,
        UUID connectionId,
        List<FieldMapping> mappings,
        Map<String, UUID> valueMap,
        List<ImportRowResult> rows,
        Counters counters
    ) {
        ImportConnectionSnapshot connection = this.connectionRepository.findById(new ImportConnectionId(connectionId))
            .orElseThrow(() -> new IllegalStateException("Import connection no longer exists"));

        ExternalImportSourceInterface source = this.sourceRegistry.get(provider);

        String pageToken = null;
        int rowNumber = 0;
        int pageCount = 0;

        // sourceKey -> created ticket id, for resolving links in the second pass - a link can
        // point at a record on a LATER page (e.g. a parent with a higher id than its child), so
        // links can't be applied while the ticket itself is being created.
        Map<String, UUID> ticketIdBySourceKey = new HashMap<>();
        List<PendingLinks> pendingLinks = new ArrayList<>();

        do {
            ImportSourcePage page = source.fetchPage(connection, pageToken);

            Integer total = page.totalCount();

            for (ImportSourceRecord record : page.records()) {
                rowNumber++;
                ProcessedRow processed = processRow(
                    rowNumber, record.fields(), record.attachments(), record.comments(), record.warnings(),
                    mappings, valueMap, project, connection, source, counters
                );
                rows.add(processed.result());

                if (processed.ticketId() != null) {
                    ticketIdBySourceKey.put(record.sourceKey(), processed.ticketId());
                    if (!record.links().isEmpty()) {
                        pendingLinks.add(new PendingLinks(rows.size() - 1, processed.ticketId(), record.links()));
                    }
                }

                // Every row is several HTTP calls (comments, attachments) on top of the ticket
                // write, so a single page can take minutes - report within the page, not just
                // after it, whenever the provider told us the total.
                if (total != null && rowNumber % PROGRESS_EVERY_ROWS == 0) {
                    saveProgress(jobId, scaled(rowNumber, total, 0, FIRST_PASS_PROGRESS_CEILING));
                }
            }

            pageToken = page.nextPageToken();
            pageCount++;

            if (total != null) {
                saveProgress(jobId, scaled(rowNumber, total, 0, FIRST_PASS_PROGRESS_CEILING));
            } else {
                // Provider doesn't expose a total (Jira) - progress is only a coarse "still going"
                // indicator (10% per page fetched, capped at the first pass' ceiling), not an
                // accurate percentage. See ImportJobAggregate.withCompleted for the authoritative
                // jump to 100% once the job actually finishes.
                saveProgress(jobId, Math.min(FIRST_PASS_PROGRESS_CEILING, pageCount * 10));
            }
        } while (pageToken != null);

        linkTickets(jobId, project, ticketIdBySourceKey, pendingLinks, rows);
    }

    /** Second pass: parent + relations, now that every ticket of this import exists. Re-saves each
     linked ticket through the same UpsertTicketCommand as a user edit would (built from its
     current snapshot, so nothing else on it changes) - the handler's own inverse-relation sync
     writes the other side of every relation, so each link only needs setting from one end. Links
     to records outside this import (another project, a skipped/failed row) can't resolve to a
     ticket and are only noted on the row, never fail it. */
    private void linkTickets(
        ImportJobId jobId,
        ProjectAggregate project,
        Map<String, UUID> ticketIdBySourceKey,
        List<PendingLinks> pendingLinks,
        List<ImportRowResult> rows
    ) {
        UUID projectId = project.getId().value();
        Set<UUID> reparentedParents = new LinkedHashSet<>();
        int done = 0;

        for (PendingLinks pending : pendingLinks) {
            done++;

            UUID parentId = null;
            List<RelatedTicketRequest> newRelations = new ArrayList<>();
            List<String> unresolved = new ArrayList<>();

            for (ImportSourceLink link : pending.links()) {
                UUID targetId = ticketIdBySourceKey.get(link.targetSourceKey());
                if (targetId == null) {
                    unresolved.add(link.targetSourceKey());
                    continue;
                }
                if (targetId.equals(pending.ticketId())) {
                    continue;
                }

                if (link.type() == ImportLinkType.PARENT) {
                    if (parentId == null) {
                        parentId = targetId;
                    }
                } else {
                    newRelations.add(new RelatedTicketRequest(targetId, toRelationType(link.type())));
                }
            }

            String linkMessage = unresolved.isEmpty()
                ? null
                : "links to items outside this import skipped: " + String.join(", ", unresolved);

            if (parentId != null || !newRelations.isEmpty()) {
                try {
                    relink(projectId, pending.ticketId(), parentId, newRelations);
                    if (parentId != null) {
                        reparentedParents.add(parentId);
                    }
                } catch (ClientException exception) {
                    linkMessage = appendMessage(linkMessage, "links not applied: " + messageOf(exception));
                } catch (Exception exception) {
                    log.warn("Linking ticket {} failed", pending.ticketId(), exception);
                    linkMessage = appendMessage(linkMessage, "links not applied: " + exception.getMessage());
                }
            }

            if (linkMessage != null) {
                ImportRowResult row = rows.get(pending.rowIndex());
                rows.set(pending.rowIndex(), new ImportRowResult(row.rowNumber(), row.outcome(), row.ticketKey(), appendMessage(row.message(), linkMessage)));
            }

            if (done % PROGRESS_EVERY_ROWS == 0) {
                saveProgress(jobId, scaled(done, pendingLinks.size(), FIRST_PASS_PROGRESS_CEILING, 99));
            }
        }

        // UpsertTicketCommandHandler only recomputes a parent's progress rollup for a NEW child or
        // a done-state flip, not for reparenting an existing ticket (its own accepted gap) - which
        // is exactly what this pass does, so every parent gets recomputed once here instead.
        for (UUID parentId : reparentedParents) {
            try {
                this.commandBus.handle(new PropagateProgressCommand(parentId));
            } catch (Exception exception) {
                log.warn("Progress rollup for imported parent {} failed", parentId, exception);
            }
        }
    }

    private void relink(UUID projectId, UUID ticketId, UUID parentId, List<RelatedTicketRequest> newRelations) throws Exception {
        TicketSnapshot snapshot = this.ticketRepository.findById(new TicketId(ticketId))
            .map(ticket -> ticket.toSnapshot())
            .orElseThrow(() -> new IllegalStateException("Imported ticket no longer exists"));

        // Existing relations first - they may already hold inverse edges written while linking an
        // earlier ticket of this import - then this record's own links, which win per target
        // (UpsertTicketCommandHandler keeps one relation per target ticket, last one listed).
        List<RelatedTicketRequest> relations = new ArrayList<>();
        for (TicketRelation relation : snapshot.relatedTickets()) {
            relations.add(new RelatedTicketRequest(relation.relatedTicketId(), relation.type()));
        }
        relations.addAll(newRelations);

        UpsertTicketRequest request = new UpsertTicketRequest(
            snapshot.subProjectId(),
            snapshot.issueTypeId(),
            snapshot.statusId(),
            parentId != null ? parentId : snapshot.parentId(),
            snapshot.title(),
            snapshot.description(),
            snapshot.priority(),
            snapshot.estimate(),
            List.copyOf(snapshot.assigneeIds()),
            List.copyOf(snapshot.flagIds()),
            List.copyOf(snapshot.tags()),
            snapshot.customFields(),
            relations
        );

        this.commandBus.handle(new UpsertTicketCommand(projectId, ticketId, request));
    }

    private TicketRelationType toRelationType(ImportLinkType type) {
        return switch (type) {
            case RELATES_TO -> TicketRelationType.RELATES_TO;
            case BLOCKS -> TicketRelationType.BLOCKS;
            case IS_BLOCKED_BY -> TicketRelationType.IS_BLOCKED_BY;
            case DUPLICATES -> TicketRelationType.DUPLICATES;
            case IS_DUPLICATED_BY -> TicketRelationType.IS_DUPLICATED_BY;
            case IMPACTS -> TicketRelationType.IMPACTS;
            case IS_IMPACTED_BY -> TicketRelationType.IS_IMPACTED_BY;
            case PARENT -> throw new IllegalArgumentException("PARENT is not a relation - it sets parentId");
        };
    }

    private String appendMessage(String existing, String addition) {
        return existing == null ? addition : existing + "; " + addition;
    }

    private ProcessedRow processRow(
        int rowNumber,
        Map<String, String> fields,
        List<ImportSourceAttachment> attachments,
        List<ImportSourceComment> comments,
        List<String> sourceWarnings,
        List<FieldMapping> mappings,
        Map<String, UUID> valueMap,
        ProjectAggregate project,
        ImportConnectionSnapshot connection,
        ExternalImportSourceInterface source,
        Counters counters
    ) {
        UUID projectId = project.getId().value();
        ImportMappingApplier.AppliedFields applied = this.mappingApplier.apply(fields, mappings, valueMap, project);

        if (applied.issueTypeId() == null) {
            counters.skipped++;
            return ProcessedRow.notCreated(new ImportRowResult(rowNumber, ImportRowOutcome.SKIPPED, null, unmatchedMessage("issue type", "issueType", fields, mappings)));
        }
        if (applied.statusId() == null) {
            counters.skipped++;
            return ProcessedRow.notCreated(new ImportRowResult(rowNumber, ImportRowOutcome.SKIPPED, null, unmatchedMessage("status", "status", fields, mappings)));
        }

        UUID ticketId = UUID.randomUUID();

        // Pre-assigned up front, not when each attachment is actually uploaded below - an inline
        // image reference in the description (see JiraImportSource's {{ATTACHMENT_IMAGE:index:alt}}
        // marker) needs to point at the SAME id the attachment ends up stored under, even though
        // the attachment itself can't be uploaded until after the ticket exists (its
        // UploadTicketAttachmentCommand needs a real ticketId to attach to).
        List<UUID> attachmentIds = new ArrayList<>();
        for (int i = 0; i < attachments.size(); i++) {
            attachmentIds.add(UUID.randomUUID());
        }

        String description = resolveAttachmentImageMarkers(applied.description(), projectId, ticketId, attachmentIds);

        try {
            UpsertTicketRequest request = new UpsertTicketRequest(
                null,
                applied.issueTypeId(),
                applied.statusId(),
                null,
                applied.title(),
                description,
                applied.priority(),
                null,
                applied.assigneeIds(),
                List.of(),
                List.of(),
                applied.customFields(),
                List.of()
            );

            this.commandBus.handle(new UpsertTicketCommand(projectId, ticketId, request));
        } catch (ClientException exception) {
            counters.failed++;
            return ProcessedRow.notCreated(new ImportRowResult(rowNumber, ImportRowOutcome.FAILED, null, messageOf(exception)));
        } catch (Exception exception) {
            counters.failed++;
            return ProcessedRow.notCreated(new ImportRowResult(rowNumber, ImportRowOutcome.FAILED, null, exception.getMessage()));
        }

        String ticketKey = this.ticketRepository.findById(new TicketId(ticketId))
            .map(ticket -> ticket.toSnapshot().key().value())
            .orElse(null);

        List<String> skipReasons = new ArrayList<>(sourceWarnings);
        for (int i = 0; i < attachments.size(); i++) {
            ImportSourceAttachment attachment = attachments.get(i);
            String reason = uploadAttachment(connection, source, projectId, ticketId, attachment, attachmentIds.get(i));
            if (reason != null) {
                counters.skippedAttachments++;
                skipReasons.add((attachment.fileName() != null ? attachment.fileName() : "attachment") + ": " + reason);
            }
        }

        ImportProvider provider = source != null ? source.provider() : null;
        for (ImportSourceComment comment : comments) {
            // Same ATTACHMENT_IMAGE markers as the description (both sources emit them for inline
            // images in comments too), resolved against the same pre-assigned attachment ids.
            String body = resolveAttachmentImageMarkers(comment.body(), projectId, ticketId, attachmentIds);
            String reason = importComment(projectId, ticketId, comment, body, provider);
            if (reason != null) {
                counters.skippedComments++;
                skipReasons.add("comment: " + reason);
            }
        }

        counters.created++;
        // The row itself still succeeded (CREATED) even when an attachment/comment on it didn't -
        // the skip reason rides in the row message anyway (instead of only the counts) so it's
        // visible from GET .../import/{jobId} without needing container log access -
        // "file-too-large" and "download failed: 401 Unauthorized" look identical as just a count.
        String message = skipReasons.isEmpty() ? null : String.join("; ", skipReasons);
        return new ProcessedRow(new ImportRowResult(rowNumber, ImportRowOutcome.CREATED, ticketKey, message), ticketId);
    }

    /** null = added, non-null = skip reason - never lets a comment problem fail the ticket it
     belongs to, same "best effort" stance as uploadAttachment. The original author/date can't be
     replicated as the comment's real authorId (see ImportSourceComment's javadoc for why), so
     they're preserved as a text header instead of silently dropped. */
    private String importComment(UUID projectId, UUID ticketId, ImportSourceComment comment, String body, ImportProvider provider) {
        try {
            String header = "_Imported from " + providerLabel(provider) + " — originally posted by "
                + (comment.authorName() != null ? comment.authorName() : "an unknown author")
                + (comment.createdAt() != null ? " on " + comment.createdAt() : "") + ":_";

            this.commandBus.handle(new AddCommentCommand(projectId, ticketId, new CommentRequest(header + "\n\n" + body)));

            return null;
        } catch (ClientException exception) {
            String reason = messageOf(exception);
            log.warn("Skipped comment for ticket {}: {}", ticketId, reason);
            return reason;
        } catch (Exception exception) {
            log.warn("Skipped comment for ticket {}: {}", ticketId, exception.getMessage(), exception);
            return exception.getMessage() != null ? exception.getMessage() : exception.getClass().getSimpleName();
        }
    }

    private String providerLabel(ImportProvider provider) {
        if (provider == null) {
            return "the source system";
        }
        return switch (provider) {
            case JIRA -> "Jira";
            case AZURE_DEVOPS -> "Azure DevOps";
            case CSV -> "CSV";
        };
    }

    /** null = uploaded, non-null = skip reason (over the size limit, unreachable, or a download
     failure) - never lets an attachment problem fail the ticket it belongs to. attachmentId is
     pre-assigned by processRow (not generated here) so it matches whatever id any inline image
     marker in the description already resolved to. */
    private String uploadAttachment(
        ImportConnectionSnapshot connection,
        ExternalImportSourceInterface source,
        UUID projectId,
        UUID ticketId,
        ImportSourceAttachment attachment,
        UUID attachmentId
    ) {
        if (attachment.downloadUrl() == null) {
            return "no download URL from source";
        }

        try {
            byte[] bytes = source.downloadAttachment(connection, attachment.downloadUrl());

            FileUploadPayload payload = new FileUploadPayload(
                attachment.fileName() != null ? attachment.fileName() : "attachment",
                attachment.contentType(),
                new ByteArrayInputStream(bytes),
                bytes.length
            );

            this.commandBus.handle(new UploadTicketAttachmentCommand(projectId, ticketId, attachmentId, payload));

            return null;
        } catch (ClientException exception) {
            String reason = messageOf(exception);
            log.warn("Skipped attachment '{}' for ticket {}: {}", attachment.fileName(), ticketId, reason);
            return reason;
        } catch (Exception exception) {
            log.warn("Skipped attachment '{}' for ticket {}: {}", attachment.fileName(), ticketId, exception.getMessage(), exception);
            return exception.getMessage() != null ? exception.getMessage() : exception.getClass().getSimpleName();
        }
    }

    // Inline-image markers emitted by JiraImportSource/AzureDevOpsImportSource for descriptions and
    // comments (see JiraImportSource's class javadoc) - CSV text never contains
    // "{{ATTACHMENT_IMAGE:", so this is a no-op for it via the early return.
    // A marker whose index is out of range (shouldn't happen, but a malformed/edited description
    // could in principle) is dropped rather than left as raw marker text in the ticket.
    private String resolveAttachmentImageMarkers(String description, UUID projectId, UUID ticketId, List<UUID> attachmentIds) {
        if (description == null || !description.contains("{{ATTACHMENT_IMAGE:")) {
            return description;
        }

        Matcher matcher = ATTACHMENT_IMAGE_MARKER.matcher(description);
        StringBuilder result = new StringBuilder();

        while (matcher.find()) {
            int index = Integer.parseInt(matcher.group(1));
            String alt = matcher.group(2);

            String replacement = "";
            if (index >= 0 && index < attachmentIds.size()) {
                String url = "/api/project/" + projectId + "/ticket/" + ticketId + "/attachment/" + attachmentIds.get(index) + "/download";
                // Its own paragraph: the frontend editor's image node is BLOCK-level, so an image
                // glued into a line of text - or several glued together, e.g. two screenshots
                // pasted side by side in one Azure DevOps <div> - doesn't map onto its schema.
                // A blank line on each side is exactly how the editor itself serializes an image.
                replacement = "\n\n![" + alt + "](" + url + ")\n\n";
            }

            matcher.appendReplacement(result, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(result);

        // Adjacent images/line breaks would otherwise stack up 3+ newlines - one blank line apart.
        return BLANK_LINES.matcher(result.toString()).replaceAll("\n\n").trim();
    }

    // Says WHY a row had no issue type/status - the target field isn't mapped at all, the mapped
    // source field is empty/absent on this record, or its raw value matched neither a value mapping
    // nor a same-name issue type/status - so the job report alone is enough to fix the mapping.
    private String unmatchedMessage(String label, String targetField, Map<String, String> fields, List<FieldMapping> mappings) {
        String sourceField = mappings.stream()
            .filter(mapping -> targetField.equals(mapping.targetField()))
            .map(FieldMapping::sourceField)
            .findFirst()
            .orElse(null);

        if (sourceField == null) {
            return "No source field is mapped to " + label;
        }

        String sourceValue = fields.get(sourceField);
        if (sourceValue == null || sourceValue.isBlank()) {
            return "Source field \"" + sourceField + "\" (mapped to " + label + ") is empty or missing on this record";
        }

        return "No " + label + " mapping matched \"" + sourceValue + "\" (source field \"" + sourceField + "\")";
    }

    private String messageOf(ClientException exception) {
        return exception.getNotifications().stream()
            .map(Notification::message)
            .reduce((first, second) -> first + "; " + second)
            .orElse(exception.getMessage());
    }

    private void markRunning(ImportJobId jobId) {
        saveJob(job -> job.withRunning(Instant.now()), jobId);
    }

    private void updateProgress(ImportJobId jobId, int processed, int total) {
        saveProgress(jobId, scaled(processed, total, 0, 99));
    }

    /** processed/total mapped linearly onto [from, to] - lets each pass own its slice of the bar. */
    private int scaled(int processed, int total, int from, int to) {
        if (total <= 0) {
            return from;
        }
        return Math.min(to, from + (int) ((long) processed * (to - from) / total));
    }

    private void saveProgress(ImportJobId jobId, int percent) {
        saveJob(job -> job.withProgress(percent, Instant.now()), jobId);
    }

    private void saveJob(UnaryOperator<ImportJobAggregate> transition, ImportJobId jobId) {
        this.jobRepository.findById(jobId).ifPresent(job -> this.jobRepository.save(transition.apply(job)));
    }

    /** ticketId is set only when the row actually created a ticket. */
    private record ProcessedRow(ImportRowResult result, UUID ticketId) {
        static ProcessedRow notCreated(ImportRowResult result) {
            return new ProcessedRow(result, null);
        }
    }

    /** rowIndex points into the job's rows list, so link problems can be appended to that row. */
    private record PendingLinks(int rowIndex, UUID ticketId, List<ImportSourceLink> links) {
    }

    private static final class Counters {
        int created;
        int skipped;
        int failed;
        int skippedAttachments;
        int skippedComments;

        ImportReport toReport(List<ImportRowResult> rows) {
            return new ImportReport(created, skipped, failed, skippedAttachments, skippedComments, rows);
        }
    }
}
