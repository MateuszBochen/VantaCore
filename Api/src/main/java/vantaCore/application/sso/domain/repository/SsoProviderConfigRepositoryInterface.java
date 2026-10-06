package vantaCore.application.sso.domain.repository;

import vantaCore.application.sso.domain.SsoProviderConfigAggregate;
import vantaCore.application.sso.domain.vo.SsoProvider;

import java.util.List;
import java.util.Optional;

public interface SsoProviderConfigRepositoryInterface {

    Optional<SsoProviderConfigAggregate> findByProvider(SsoProvider provider);

    /** Only providers that have actually been saved at least once. */
    List<SsoProviderConfigAggregate> findAll();

    void save(SsoProviderConfigAggregate config);
}
