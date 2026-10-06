package vantaCore.application.file.appliaction.query.listTicketAttachments;

import java.time.Instant;
import java.util.UUID;

public record TicketAttachmentResult(
    UUID id,
    String originalFilename,
    String contentType,
    long sizeBytes,
    UUID uploadedByUserId,
    Instant uploadedAt,
    /** authenticated download URL - see TicketAttachmentController.downloadAttachment */
    String url
) {
}
