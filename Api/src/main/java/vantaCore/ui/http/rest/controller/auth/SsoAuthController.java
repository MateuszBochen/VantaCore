package vantaCore.ui.http.rest.controller.auth;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.exception.UnprocessableEntityException;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.application.sso.appliaction.dto.SsoCallbackRequest;
import vantaCore.application.sso.appliaction.query.completeSsoLogin.CompleteSsoLoginQuery;
import vantaCore.application.sso.appliaction.query.startSsoLogin.SsoAuthorizationResult;
import vantaCore.application.sso.appliaction.query.startSsoLogin.StartSsoLoginQuery;
import vantaCore.application.sso.domain.vo.SsoProvider;
import vantaCore.application.user.appliaction.query.login.LoginResult;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Single;

import java.util.List;

/** SSO login, under /web-api (permitAll) since nobody has a token yet. The provider redirects the
 browser to a FRONT route ({app.front-url}/login/sso/{provider}), never to this API - the front
 then posts the code/state here. See StartSsoLoginQueryHandler / CompleteSsoLoginQueryHandler. */
@RestController
@RequestMapping("/web-api/auth/sso")
final public class SsoAuthController {

    private final QueryBusInterface queryBus;

    SsoAuthController(QueryBusInterface queryBus) {
        this.queryBus = queryBus;
    }

    @GetMapping("/{provider}/authorize")
    public OpenApiResponse<Single<SsoAuthorizationResult>> authorize(
        @PathVariable String provider,
        @RequestParam(required = false) String redirectUri
    ) throws Exception {

        Item<SsoAuthorizationResult> result = this.queryBus.ask(new StartSsoLoginQuery(parseProvider(provider), redirectUri));

        return OpenApiResponse.one(result, HttpStatus.OK);
    }

    @PostMapping("/{provider}/callback")
    public OpenApiResponse<Single<LoginResult>> callback(
        @PathVariable String provider,
        @RequestBody SsoCallbackRequest request
    ) throws Exception {

        Item<LoginResult> result = this.queryBus.ask(new CompleteSsoLoginQuery(parseProvider(provider), request));

        return OpenApiResponse.one(result, HttpStatus.OK);
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
