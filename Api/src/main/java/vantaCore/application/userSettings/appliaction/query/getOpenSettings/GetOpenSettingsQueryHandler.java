package vantaCore.application.userSettings.appliaction.query.getOpenSettings;

import org.springframework.stereotype.Component;
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

/** Reads the sso module's configuration directly - a read-only cross-module lookup (see CLAUDE.md),
 not a side effect. Every SsoProvider is listed (never-configured ones as disabled), in enum order,
 same as the admin-side ListSsoProvidersQueryHandler; a disabled provider never exposes settings. */
@Component
final public class GetOpenSettingsQueryHandler implements QueryHandlerInterface<GetOpenSettingsQuery, Item<OpenSettingsResult>> {

    private final SsoProviderConfigRepositoryInterface ssoRepository;

    public GetOpenSettingsQueryHandler(SsoProviderConfigRepositoryInterface ssoRepository) {
        this.ssoRepository = ssoRepository;
    }

    @Override
    public Item<OpenSettingsResult> handle(GetOpenSettingsQuery query) {
        Map<SsoProvider, SsoProviderConfigAggregate> saved = this.ssoRepository.findAll().stream()
            .collect(Collectors.toMap(SsoProviderConfigAggregate::getProvider, Function.identity()));

        List<OpenSsoProviderResult> sso = Arrays.stream(SsoProvider.values())
            .map(provider -> saved.getOrDefault(provider, SsoProviderConfigAggregate.notConfigured(provider)))
            .map(this::toResult)
            .toList();

        return Item.fromPayload("open-settings", new OpenSettingsResult(sso));
    }

    private OpenSsoProviderResult toResult(SsoProviderConfigAggregate config) {
        Object settings = config.isEnabled() && config.getProvider() == SsoProvider.OIDC
            ? new OpenSsoProviderResult.OidcSettings(config.getDisplayName())
            : null;

        return new OpenSsoProviderResult(config.getProvider(), config.isEnabled(), settings);
    }
}
