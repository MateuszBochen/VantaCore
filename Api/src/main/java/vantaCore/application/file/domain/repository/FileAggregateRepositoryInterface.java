package vantaCore.application.file.domain.repository;

import vantaCore.application.file.domain.FileAggregate;
import vantaCore.application.file.domain.vo.FileId;
import vantaCore.application.file.domain.vo.FileOwnerType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FileAggregateRepositoryInterface {

    void save(FileAggregate file);

    Optional<FileAggregate> findById(FileId id);

    /** newest first - used both for "attachments of this ticket" and "current avatar of this user" */
    List<FileAggregate> findAllByOwner(FileOwnerType ownerType, UUID ownerId);

    void deleteById(FileId id);
}
