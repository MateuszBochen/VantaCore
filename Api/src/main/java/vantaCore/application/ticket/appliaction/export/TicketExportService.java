package vantaCore.application.ticket.appliaction.export;

import org.springframework.stereotype.Component;
import vantaCore.application.file.domain.FileAggregate;
import vantaCore.application.file.domain.FileSnapshot;
import vantaCore.application.file.domain.repository.FileAggregateRepositoryInterface;
import vantaCore.application.file.domain.storage.FileStorageInterface;
import vantaCore.application.file.domain.vo.FileOwnerType;
import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.IssueType;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.project.domain.vo.Status;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.infrastructure.csv.CsvSupport;
import vantaCore.application.ticket.domain.TicketAggregate;
import vantaCore.application.ticket.domain.TicketSnapshot;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.user.domain.repository.UserAggregateRepositoryInterface;
import vantaCore.application.user.domain.repository.UserAggregateRepositoryInterface.UserSummary;

import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/** Not dispatched through the query bus - a binary/streaming HTTP response doesn't fit the
 Item<T>/Collection<T> QueryResult envelope, same "plain shared component the controller calls
 directly" carve-out as FileContentLoader. Called directly from TicketExportController inside a
 StreamingResponseBody, so nothing here buffers the whole export in memory - each ticket/attachment
 is written to the response as it's produced. */
@Component
public class TicketExportService {

    private static final List<String> CSV_HEADER = List.of(
        "Key", "Title", "Description", "Issue Type", "Status", "Priority", "Estimate", "Assignees", "Tags", "Created At"
    );

    private final ProjectAggregateRepositoryInterface projectRepository;
    private final TicketAggregateRepositoryInterface ticketRepository;
    private final UserAggregateRepositoryInterface userRepository;
    private final FileAggregateRepositoryInterface fileRepository;
    private final FileStorageInterface fileStorage;

    public TicketExportService(
        ProjectAggregateRepositoryInterface projectRepository,
        TicketAggregateRepositoryInterface ticketRepository,
        UserAggregateRepositoryInterface userRepository,
        FileAggregateRepositoryInterface fileRepository,
        FileStorageInterface fileStorage
    ) {
        this.projectRepository = projectRepository;
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.fileRepository = fileRepository;
        this.fileStorage = fileStorage;
    }

    public void writeCsv(UUID projectId, Set<UUID> issueTypeIds, Set<UUID> statusIds, OutputStream output) throws IOException {
        ExportContext context = loadContext(projectId, issueTypeIds, statusIds);

        Writer writer = new OutputStreamWriter(output, StandardCharsets.UTF_8);
        CsvSupport.writeRow(writer, CSV_HEADER);

        for (TicketAggregate ticket : context.tickets()) {
            CsvSupport.writeRow(writer, toCsvRow(ticket.toSnapshot(), context));
        }

        writer.flush();
    }

    // manifest.csv (same shape as writeCsv) at the archive root, plus attachments/{ticketKey}/
    // {fileName} per ticket - a filename collision within one ticket's own folder is disambiguated
    // with a numeric suffix rather than silently overwriting the earlier entry.
    public void writeFullExport(UUID projectId, Set<UUID> issueTypeIds, Set<UUID> statusIds, OutputStream output) throws IOException {
        ExportContext context = loadContext(projectId, issueTypeIds, statusIds);

        ZipOutputStream zip = new ZipOutputStream(output, StandardCharsets.UTF_8);

        zip.putNextEntry(new ZipEntry("manifest.csv"));
        Writer manifestWriter = new OutputStreamWriter(zip, StandardCharsets.UTF_8);
        CsvSupport.writeRow(manifestWriter, CSV_HEADER);
        for (TicketAggregate ticket : context.tickets()) {
            CsvSupport.writeRow(manifestWriter, toCsvRow(ticket.toSnapshot(), context));
        }
        manifestWriter.flush();
        zip.closeEntry();

        for (TicketAggregate ticket : context.tickets()) {
            writeTicketAttachments(zip, ticket.toSnapshot());
        }

        zip.finish();
    }

    private void writeTicketAttachments(ZipOutputStream zip, TicketSnapshot ticket) throws IOException {
        List<FileAggregate> attachments = this.fileRepository.findAllByOwner(FileOwnerType.TICKET_ATTACHMENT, ticket.id().value());
        Set<String> usedNames = new HashSet<>();

        for (FileAggregate attachment : attachments) {
            FileSnapshot snapshot = attachment.toSnapshot();
            String entryName = "attachments/" + ticket.key().value() + "/" + uniqueName(snapshot.originalFilename(), usedNames);

            zip.putNextEntry(new ZipEntry(entryName));
            try (var content = this.fileStorage.load(snapshot.storageKey())) {
                content.transferTo(zip);
            }
            zip.closeEntry();
        }
    }

    private String uniqueName(String originalFilename, Set<String> usedNames) {
        String name = originalFilename == null ? "attachment" : originalFilename;

        if (usedNames.add(name)) {
            return name;
        }

        String base = name;
        String extension = "";
        int dot = name.lastIndexOf('.');
        if (dot > 0) {
            base = name.substring(0, dot);
            extension = name.substring(dot);
        }

        int counter = 2;
        String candidate;
        do {
            candidate = base + " (" + counter + ")" + extension;
            counter++;
        } while (!usedNames.add(candidate));

        return candidate;
    }

    private List<String> toCsvRow(TicketSnapshot ticket, ExportContext context) {
        return List.of(
            ticket.key().value(),
            nullToEmpty(ticket.title()),
            nullToEmpty(ticket.description()),
            context.issueTypeName(ticket.issueTypeId()),
            context.statusName(ticket.statusId()),
            ticket.priority() != null ? ticket.priority().toString() : "",
            String.valueOf(ticket.estimate()),
            ticket.assigneeIds().stream().map(context::userEmail).filter(Objects::nonNull).collect(Collectors.joining(";")),
            String.join(";", ticket.tags()),
            ticket.createdAt() != null ? ticket.createdAt().toString() : ""
        );
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private ExportContext loadContext(UUID projectId, Set<UUID> issueTypeIds, Set<UUID> statusIds) {
        ProjectAggregate project = this.projectRepository.findById(new ProjectId(projectId)).orElseThrow(ProjectNotFoundException::new);
        List<TicketAggregate> tickets = this.ticketRepository.findAllByProjectIdAndFilters(projectId, issueTypeIds, statusIds);

        Map<UUID, String> issueTypeNames = project.getIssueTypes().stream()
            .collect(Collectors.toMap(IssueType::id, IssueType::name, (a, b) -> a));
        Map<UUID, String> statusNames = project.getStatuses().stream()
            .collect(Collectors.toMap(Status::id, Status::name, (a, b) -> a));

        Map<UUID, String> userEmails = new HashMap<>();
        for (UserSummary user : this.userRepository.findAllSummaries()) {
            userEmails.put(user.id().value(), user.email());
        }

        return new ExportContext(tickets, issueTypeNames, statusNames, userEmails);
    }

    private record ExportContext(
        List<TicketAggregate> tickets,
        Map<UUID, String> issueTypeNames,
        Map<UUID, String> statusNames,
        Map<UUID, String> userEmails
    ) {
        String issueTypeName(UUID id) {
            return id == null ? "" : issueTypeNames.getOrDefault(id, "");
        }

        String statusName(UUID id) {
            return id == null ? "" : statusNames.getOrDefault(id, "");
        }

        String userEmail(UUID id) {
            return userEmails.get(id);
        }
    }
}
