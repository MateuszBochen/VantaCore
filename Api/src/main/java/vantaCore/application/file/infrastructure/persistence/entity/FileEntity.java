package vantaCore.application.file.infrastructure.persistence.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import vantaCore.application.file.domain.FileAggregate;
import vantaCore.application.file.domain.FileSnapshot;
import vantaCore.application.file.domain.vo.FileId;
import vantaCore.application.file.domain.vo.FileOwnerType;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "files")
public class FileEntity {

    @Id
    private UUID id;

    private String originalFilename;
    private String contentType;
    private long sizeBytes;
    private String storageKey;

    @Enumerated(EnumType.STRING)
    private FileOwnerType ownerType;

    private UUID ownerId;
    private UUID uploadedByUserId;
    private Instant uploadedAt;

    // Hibernate requires it
    protected FileEntity() {}

    private FileEntity(
        UUID id,
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

    public static FileEntity fromDomain(FileAggregate file) {
        FileSnapshot snapshot = file.toSnapshot();

        return new FileEntity(
            snapshot.id().value(),
            snapshot.originalFilename(),
            snapshot.contentType(),
            snapshot.sizeBytes(),
            snapshot.storageKey(),
            snapshot.ownerType(),
            snapshot.ownerId(),
            snapshot.uploadedByUserId(),
            snapshot.uploadedAt()
        );
    }

    public FileAggregate toDomain() {
        return FileAggregate.newFile(
            new FileId(this.id),
            this.originalFilename,
            this.contentType,
            this.sizeBytes,
            this.storageKey,
            this.ownerType,
            this.ownerId,
            this.uploadedByUserId,
            this.uploadedAt
        );
    }
}
