package vantaCore.application.sso.appliaction.query.listSsoProviders;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.sso.domain.SsoProviderConfigAggregate;
import vantaCore.application.sso.domain.repository.SsoProviderConfigRepositoryInterface;
import vantaCore.application.sso.domain.vo.SsoProvider;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Always every SsoProvider, in enum order - a provider never saved yet comes back as
 notConfigured (disabled, empty) rather than being missing, so the settings page can render all
 four forms from this one response. Not paginated in practice (four items at most), but still the
 standard Collection shape. */
@Component
final public class ListSsoProvidersQueryHandler implements QueryHandlerInterface<ListSsoProvidersQuery, Collection<SsoProviderResult>> {

    private final SsoProviderConfigRepositoryInterface repository;

    public ListSsoProvidersQueryHandler(SsoProviderConfigRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public Collection<SsoProviderResult> handle(ListSsoProvidersQuery query) {
        Map<SsoProvider, SsoProviderConfigAggregate> saved = this.repository.findAll().stream()
            .collect(Collectors.toMap(SsoProviderConfigAggregate::getProvider, Function.identity()));

        List<Item<SsoProviderResult>> items = Arrays.stream(SsoProvider.values())
            .map(provider -> saved.getOrDefault(provider, SsoProviderConfigAggregate.notConfigured(provider)))
            .map(config -> Item.fromPayload(config.getProvider().name().toLowerCase(), toResult(config)))
            .toList();

        return new Collection<>(0, items.size(), items.size(), items);
    }

    private SsoProviderResult toResult(SsoProviderConfigAggregate config) {
        return new SsoProviderResult(
            config.getProvider(),
            config.isEnabled(),
            config.getClientId(),
            config.hasClientSecret(),
            config.getTenantId(),
            config.getIssuerUrl(),
            config.getDisplayName(),
            config.isAutoProvisionUsers()
        );
    }
}
