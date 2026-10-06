package vantaCore.application.file.domain.storage;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

/** Where in the blob store a file lives, grouped by what it belongs to instead of one flat
 directory - e.g. projects/{projectId}/tickets/{ticketId}. Only buildable through the named
 factories below, from ids and fixed literals, so a directory can never carry user-supplied text
 (same path-traversal stance as FileStorageInterface.store never letting callers choose the key).
 Editor images have no owner to group by, so they're bucketed by upload month instead. */
public record StorageDirectory(List<String> segments) {

    private static final Pattern SAFE_SEGMENT = Pattern.compile("[a-z0-9-]+");

    public StorageDirectory {
        if (segments == null || segments.isEmpty()) {
            throw new IllegalArgumentException("StorageDirectory needs at least one segment");
        }
        for (String segment : segments) {
            if (segment == null || !SAFE_SEGMENT.matcher(segment).matches()) {
                throw new IllegalArgumentException("Invalid storage directory segment: " + segment);
            }
        }
        segments = List.copyOf(segments);
    }

    public static StorageDirectory ticketAttachment(UUID projectId, UUID ticketId) {
        return new StorageDirectory(List.of("projects", projectId.toString(), "tickets", ticketId.toString()));
    }

    public static StorageDirectory subProjectAttachment(UUID projectId, UUID subProjectId) {
        return new StorageDirectory(List.of("projects", projectId.toString(), "sub-projects", subProjectId.toString()));
    }

    public static StorageDirectory platformDocumentationAttachment(UUID projectId) {
        return new StorageDirectory(List.of("projects", projectId.toString(), "documentation"));
    }

    public static StorageDirectory userAvatar(UUID userId) {
        return new StorageDirectory(List.of("users", userId.toString(), "avatar"));
    }

    public static StorageDirectory editorImage(Instant uploadedAt) {
        ZonedDateTime date = uploadedAt.atZone(ZoneOffset.UTC);
        return new StorageDirectory(List.of("editor-images", String.valueOf(date.getYear()), String.format("%02d", date.getMonthValue())));
    }

    /** Forward-slash joined, relative - the storage adapter maps it onto its own root. */
    public String path() {
        return String.join("/", segments);
    }
}
