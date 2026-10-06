package vantaCore.application.importExport.domain;

import vantaCore.application.importExport.domain.vo.ImportConnectionId;
import vantaCore.application.importExport.domain.vo.ImportProvider;

import java.time.Instant;
import java.util.UUID;

/** decryptedToken is populated only by ImportConnectionRepositoryInterface.findById (which decrypts
 on the way out) - never round-tripped back to the frontend, only used server-side to call the
 source system's API (see ExternalImportSourceInterface implementations). See
 ImportConnectionAggregate's javadoc for sourceProject/email. */
public record ImportConnectionSnapshot(
    ImportConnectionId id,
    UUID projectId,
    ImportProvider provider,
    String baseUrl,
    String sourceProject,
    String email,
    String decryptedToken,
    UUID createdByUserId,
    Instant createdAt
) {
}
