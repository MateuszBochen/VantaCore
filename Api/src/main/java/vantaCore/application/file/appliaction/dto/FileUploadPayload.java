package vantaCore.application.file.appliaction.dto;

import java.io.InputStream;

/** Plain-Java carrier for an uploaded file's stream/metadata, extracted from the Spring-web
 MultipartFile at the controller boundary so that type doesn't leak past it into commands/handlers.
 content is the raw multipart part stream, read exactly once (by FileStorageInterface.store) rather
 than buffered into a byte[] first - sizeBytes comes from the multipart header, not content.length,
 since reading the stream to measure it would defeat the point. */
public record FileUploadPayload(
    String originalFilename,
    String contentType,
    InputStream content,
    long sizeBytes
) {
}
