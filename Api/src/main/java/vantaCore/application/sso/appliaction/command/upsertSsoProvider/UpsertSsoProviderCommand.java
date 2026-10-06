package vantaCore.application.sso.appliaction.command.upsertSsoProvider;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;
import vantaCore.application.sso.appliaction.dto.UpsertSsoProviderRequest;
import vantaCore.application.sso.domain.vo.SsoProvider;

@RequiresResource(Resource.SSO_MANAGE)
final public class UpsertSsoProviderCommand {

    @NotNull
    private final SsoProvider provider;

    @Valid
    @NotNull
    private final UpsertSsoProviderRequest upsertSsoProviderRequest;

    public UpsertSsoProviderCommand(SsoProvider provider, UpsertSsoProviderRequest upsertSsoProviderRequest) {
        this.provider = provider;
        this.upsertSsoProviderRequest = upsertSsoProviderRequest;
    }

    public SsoProvider getProvider() {
        return provider;
    }

    public UpsertSsoProviderRequest getUpsertSsoProviderRequest() {
        return upsertSsoProviderRequest;
    }
}
