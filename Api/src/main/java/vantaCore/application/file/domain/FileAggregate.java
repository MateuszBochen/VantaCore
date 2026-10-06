package vantaCore.application.file.domain;

import vantaCore.application.file.domain.vo.FileId;
import vantaCore.application.file.domain.vo.FileOwnerType;

import java.time.Instant;
import java.util.UUID;

/** Write-once - a file's metadata is never edited after upload, only created or deleted (mirrors
 TicketHistoryEntryAggregate), so there's no changeX counterpart to newFile. */
public class FileAggregate {
    private final FileId id;
    private final String originalFilename;
    private final String contentType;
    private final long sizeBytes;
    private final String storageKey;
    private final FileOwnerType ownerType;
    private final UUID ownerId;
    private final UUID uploadedByUserId;
    private final Instant uploadedAt;

    private FileAggregate(
        FileId id,
        String originalFilename,
        String contentType,
        long sizeBytes,
        String storageKey,
        FileOwnerType ownerType,
        UUID ownerId,
        UUID uploadedByUserId,
        Instant uploadedAt
    ) {
        this.id = id;
        this.originalFilename = originalFilename;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.storageKey = storageKey;
        this.ownerType = ownerType;
        this.ownerId = ownerId;
        this.uploadedByUserId = uploadedByUserId;
        this.uploadedAt = uploadedAt;
    }

    public static FileAggregate newFile(
        FileId id,
        String originalFilename,
        String contentType,
        long sizeBytes,
        String storageKey,
        FileOwnerType ownerType,
        UUID ownerId,
        UUID uploadedByUserId,
        Instant uploadedAt
    ) {
        return new FileAggregate(
            id, originalFilename, contentType, sizeBytes, storageKey, ownerType, ownerId, uploadedByUserId, uploadedAt
        );
    }

    public FileSnapshot toSnapshot() {
        return new FileSnapshot(
            id, originalFilename, contentType, sizeBytes, storageKey, ownerType, ownerId, uploadedByUserId, uploadedAt
        );
    }
}
