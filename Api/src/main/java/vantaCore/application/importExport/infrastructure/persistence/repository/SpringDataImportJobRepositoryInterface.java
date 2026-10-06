package vantaCore.application.importExport.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vantaCore.application.importExport.infrastructure.persistence.entity.ImportJobEntity;

import java.util.UUID;

public interface SpringDataImportJobRepositoryInterface extends JpaRepository<ImportJobEntity, UUID> {
}
