package vantaCore.application.sso.appliaction.service;

import org.springframework.stereotype.Component;
import vantaCore.application.sso.domain.login.SsoProviderClientInterface;
import vantaCore.application.sso.domain.vo.SsoProvider;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/** SsoProvider -> its client bean, same shape as ExternalImportSourceRegistry. */
@Component
public class SsoProviderClientRegistry {

    private final Map<SsoProvider, SsoProviderClientInterface> clients = new EnumMap<>(SsoProvider.class);

    public SsoProviderClientRegistry(List<SsoProviderClientInterface> clients) {
        for (SsoProviderClientInterface client : clients) {
            this.clients.put(client.provider(), client);
        }
    }

    public SsoProviderClientInterface get(SsoProvider provider) {
        SsoProviderClientInterface client = this.clients.get(provider);
        if (client == null) {
            throw new IllegalStateException("No SSO client registered for " + provider);
        }
        return client;
    }
}
