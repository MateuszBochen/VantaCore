package vantaCore.application.file.appliaction.query.listPlatformDocumentationAttachments;

import java.time.Instant;
import java.util.UUID;

public record PlatformDocumentationAttachmentResult(
    UUID id,
    String originalFilename,
    String contentType,
    long sizeBytes,
    UUID uploadedByUserId,
    Instant uploadedAt,
    /** authenticated download URL - see PlatformDocumentationAttachmentController.downloadAttachment */
    String url
) {
}
