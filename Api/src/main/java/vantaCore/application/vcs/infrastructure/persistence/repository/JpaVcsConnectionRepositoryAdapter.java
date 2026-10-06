package vantaCore.application.vcs.infrastructure.persistence.repository;

import org.springframework.stereotype.Repository;
import vantaCore.application.shared.infrastructure.security.CredentialEncryptor;
import vantaCore.application.vcs.domain.VcsConnectionAggregate;
import vantaCore.application.vcs.domain.VcsConnectionSnapshot;
import vantaCore.application.vcs.domain.repository.VcsConnectionRepositoryInterface;
import vantaCore.application.vcs.domain.vo.VcsConnectionId;
import vantaCore.application.vcs.infrastructure.persistence.entity.VcsConnectionEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class JpaVcsConnectionRepositoryAdapter implements VcsConnectionRepositoryInterface {

    private final SpringDataVcsConnectionRepositoryInterface repository;
    private final CredentialEncryptor credentialEncryptor;

    public JpaVcsConnectionRepositoryAdapter(
        SpringDataVcsConnectionRepositoryInterface repository,
        CredentialEncryptor credentialEncryptor
    ) {
        this.repository = repository;
        this.credentialEncryptor = credentialEncryptor;
    }

    @Override
    public void save(VcsConnectionAggregate connection) {
        String encrypted = this.credentialEncryptor.encrypt(connection.getWebhookSecret());
        this.repository.save(VcsConnectionEntity.fromDomain(connection, encrypted));
    }

    @Override
    public Optional<VcsConnectionSnapshot> findById(VcsConnectionId id) {
        return this.repository.findById(id.value())
            .map(entity -> entity.toDomain(this.credentialEncryptor.decrypt(entity.getEncryptedWebhookSecret())));
    }

    @Override
    public List<VcsConnectionSnapshot> findAllByProjectId(UUID projectId) {
        return this.repository.findAllByProjectId(projectId).stream()
            .map(entity -> entity.toDomain(this.credentialEncryptor.decrypt(entity.getEncryptedWebhookSecret())))
            .toList();
    }

    @Override
    public void deleteById(VcsConnectionId id) {
        this.repository.deleteById(id.value());
    }
}
