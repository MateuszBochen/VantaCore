package vantaCore.application.importExport.domain.source;

public record ImportSourceAttachment(
    String fileName,
    String contentType,
    Long sizeBytes,
    String downloadUrl
) {
}
