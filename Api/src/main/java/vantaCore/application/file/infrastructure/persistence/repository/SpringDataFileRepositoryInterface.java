package vantaCore.application.file.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vantaCore.application.file.domain.vo.FileOwnerType;
import vantaCore.application.file.infrastructure.persistence.entity.FileEntity;

import java.util.List;
import java.util.UUID;

public interface SpringDataFileRepositoryInterface extends JpaRepository<FileEntity, UUID> {

    List<FileEntity> findAllByOwnerTypeAndOwnerIdOrderByUploadedAtDesc(FileOwnerType ownerType, UUID ownerId);
}
