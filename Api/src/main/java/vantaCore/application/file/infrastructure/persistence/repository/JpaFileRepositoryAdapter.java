package vantaCore.application.file.infrastructure.persistence.repository;

import org.springframework.stereotype.Repository;
import vantaCore.application.file.domain.FileAggregate;
import vantaCore.application.file.domain.repository.FileAggregateRepositoryInterface;
import vantaCore.application.file.domain.vo.FileId;
import vantaCore.application.file.domain.vo.FileOwnerType;
import vantaCore.application.file.infrastructure.persistence.entity.FileEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class JpaFileRepositoryAdapter implements FileAggregateRepositoryInterface {

    private final SpringDataFileRepositoryInterface repository;

    public JpaFileRepositoryAdapter(SpringDataFileRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public void save(FileAggregate file) {
        this.repository.save(FileEntity.fromDomain(file));
    }

    @Override
    public Optional<FileAggregate> findById(FileId id) {
        return this.repository.findById(id.value()).map(FileEntity::toDomain);
    }

    @Override
    public List<FileAggregate> findAllByOwner(FileOwnerType ownerType, UUID ownerId) {
        return this.repository.findAllByOwnerTypeAndOwnerIdOrderByUploadedAtDesc(ownerType, ownerId).stream()
            .map(FileEntity::toDomain)
            .toList();
    }

    @Override
    public void deleteById(FileId id) {
        this.repository.deleteById(id.value());
    }
}
