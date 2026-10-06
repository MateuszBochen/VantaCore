package vantaCore.application.file.domain;

import vantaCore.application.file.domain.vo.FileId;
import vantaCore.application.file.domain.vo.FileOwnerType;

import java.time.Instant;
import java.util.UUID;

/** Read-only view of a FileAggregate's state - the only way anything outside the aggregate gets at
 its fields, since FileAggregate itself exposes no getters. */
public record FileSnapshot(
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
}
