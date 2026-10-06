package vantaCore.application.sso.appliaction.command.upsertSsoProvider;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.sso.appliaction.dto.UpsertSsoProviderRequest;
import vantaCore.application.sso.domain.SsoProviderConfigAggregate;
import vantaCore.application.sso.domain.policy.UpsertSsoProviderPolicy;
import vantaCore.application.sso.domain.repository.SsoProviderConfigRepositoryInterface;

import java.time.Instant;

/** Create-or-update keyed by provider alone - the first PUT for a provider creates its row, later
 ones replace it (secret excepted, see SsoProviderConfigAggregate.configure). */
@Component
final public class UpsertSsoProviderCommandHandler implements CommandHandlerInterface<UpsertSsoProviderCommand> {

    private final SsoProviderConfigRepositoryInterface repository;
    private final UpsertSsoProviderPolicy policy;

    public UpsertSsoProviderCommandHandler(SsoProviderConfigRepositoryInterface repository, UpsertSsoProviderPolicy policy) {
        this.repository = repository;
        this.policy = policy;
    }

    @Override
    public Void handle(UpsertSsoProviderCommand command) {
        UpsertSsoProviderRequest request = command.getUpsertSsoProviderRequest();

        SsoProviderConfigAggregate current = this.repository.findByProvider(command.getProvider())
            .orElseGet(() -> SsoProviderConfigAggregate.notConfigured(command.getProvider()));

        SsoProviderConfigAggregate updated = current.configure(
            request.getEnabled(),
            request.getClientId(),
            request.getClientSecret(),
            request.getTenantId(),
            request.getIssuerUrl(),
            request.getDisplayName(),
            Boolean.TRUE.equals(request.getAutoProvisionUsers()),
            Instant.now()
        );

        this.policy.check(updated).assertAllowed();

        this.repository.save(updated);

        return null;
    }
}
