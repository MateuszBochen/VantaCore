package vantaCore.application.sso.infrastructure.persistence.repository;

import org.springframework.stereotype.Repository;
import vantaCore.application.shared.infrastructure.security.CredentialEncryptor;
import vantaCore.application.sso.domain.SsoProviderConfigAggregate;
import vantaCore.application.sso.domain.repository.SsoProviderConfigRepositoryInterface;
import vantaCore.application.sso.domain.vo.SsoProvider;
import vantaCore.application.sso.infrastructure.persistence.entity.SsoProviderConfigEntity;

import java.util.List;
import java.util.Optional;

/** client_secret is encrypted at rest with CredentialEncryptor, same as import/VCS connection
 credentials - a provider saved without a secret yet stores NULL (CredentialEncryptor itself
 doesn't accept null). */
@Repository
public class JpaSsoProviderConfigRepositoryAdapter implements SsoProviderConfigRepositoryInterface {

    private final SpringDataSsoProviderConfigRepositoryInterface repository;
    private final CredentialEncryptor credentialEncryptor;

    public JpaSsoProviderConfigRepositoryAdapter(
        SpringDataSsoProviderConfigRepositoryInterface repository,
        CredentialEncryptor credentialEncryptor
    ) {
        this.repository = repository;
        this.credentialEncryptor = credentialEncryptor;
    }

    @Override
    public Optional<SsoProviderConfigAggregate> findByProvider(SsoProvider provider) {
        return this.repository.findById(provider).map(this::toDomain);
    }

    @Override
    public List<SsoProviderConfigAggregate> findAll() {
        return this.repository.findAll().stream().map(this::toDomain).toList();
    }

    @Override
    public void save(SsoProviderConfigAggregate config) {
        String encrypted = config.hasClientSecret() ? this.credentialEncryptor.encrypt(config.getClientSecret()) : null;
        this.repository.save(SsoProviderConfigEntity.fromDomain(config, encrypted));
    }

    private SsoProviderConfigAggregate toDomain(SsoProviderConfigEntity entity) {
        String encrypted = entity.getEncryptedClientSecret();
        return entity.toDomain(encrypted != null ? this.credentialEncryptor.decrypt(encrypted) : null);
    }
}
