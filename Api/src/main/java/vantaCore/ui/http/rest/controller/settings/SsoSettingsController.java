package vantaCore.ui.http.rest.controller.settings;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.exception.UnprocessableEntityException;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.application.sso.appliaction.command.upsertSsoProvider.UpsertSsoProviderCommand;
import vantaCore.application.sso.appliaction.dto.UpsertSsoProviderRequest;
import vantaCore.application.sso.appliaction.query.listSsoProviders.ListSsoProvidersQuery;
import vantaCore.application.sso.appliaction.query.listSsoProviders.SsoProviderResult;
import vantaCore.application.sso.domain.vo.SsoProvider;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Empty;
import vantaCore.ui.http.rest.response.dto.Many;

import java.util.List;

/** Platform-wide SSO provider configuration (not project-scoped). Stores configuration only - the
 actual SSO login flow isn't wired to it yet. */
@RestController
@RequestMapping("/api/settings/sso")
final public class SsoSettingsController {

    private final CommandBusInterface commandBus;
    private final QueryBusInterface queryBus;

    SsoSettingsController(CommandBusInterface commandBus, QueryBusInterface queryBus) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }

    @GetMapping
    public OpenApiResponse<Many<SsoProviderResult>> listProviders() throws Exception {
        Collection<SsoProviderResult> result = this.queryBus.ask(new ListSsoProvidersQuery());

        return OpenApiResponse.many(result, HttpStatus.OK);
    }

    @PutMapping("/{provider}")
    public OpenApiResponse<Empty> upsertProvider(
        @PathVariable String provider,
        @RequestBody UpsertSsoProviderRequest request
    ) throws Exception {

        this.commandBus.handle(new UpsertSsoProviderCommand(parseProvider(provider), request));

        return OpenApiResponse.empty(HttpStatus.OK);
    }

    private SsoProvider parseProvider(String value) {
        try {
            return SsoProvider.fromPathValue(value);
        } catch (IllegalArgumentException exception) {
            throw new UnprocessableEntityException(List.of(new Notification(
                "invalid-sso-provider",
                "provider must be one of microsoft, google, github, oidc",
                true
            )));
        }
    }
}
