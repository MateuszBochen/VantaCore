package vantaCore.application.file.appliaction.query.listSubProjectAttachments;

import java.time.Instant;
import java.util.UUID;

public record SubProjectAttachmentResult(
    UUID id,
    String originalFilename,
    String contentType,
    long sizeBytes,
    UUID uploadedByUserId,
    Instant uploadedAt,
    /** authenticated download URL - see SubProjectAttachmentController.downloadAttachment */
    String url
) {
}
