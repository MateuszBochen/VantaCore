package vantaCore.application.sso.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vantaCore.application.sso.domain.vo.SsoProvider;
import vantaCore.application.sso.infrastructure.persistence.entity.SsoProviderConfigEntity;

public interface SpringDataSsoProviderConfigRepositoryInterface extends JpaRepository<SsoProviderConfigEntity, SsoProvider> {
}
