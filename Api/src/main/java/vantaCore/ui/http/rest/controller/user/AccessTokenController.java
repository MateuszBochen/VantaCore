package vantaCore.ui.http.rest.controller.user;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.accessToken.appliaction.command.revokeAccessToken.RevokeAccessTokenCommand;
import vantaCore.application.accessToken.appliaction.dto.CreateAccessTokenRequest;
import vantaCore.application.accessToken.appliaction.query.createAccessToken.CreateAccessTokenQuery;
import vantaCore.application.accessToken.appliaction.query.createAccessToken.CreatedAccessTokenResult;
import vantaCore.application.accessToken.appliaction.query.listAccessTokens.AccessTokenResult;
import vantaCore.application.accessToken.appliaction.query.listAccessTokens.ListAccessTokensQuery;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Empty;
import vantaCore.ui.http.rest.response.dto.Many;
import vantaCore.ui.http.rest.response.dto.Single;

import java.util.UUID;

/** The caller's own personal access tokens (Profile -> Access tokens). The token secret is only in
 the POST response - it can't be fetched again afterwards. */
@RestController
@RequestMapping("/api/user/me/access-tokens")
final public class AccessTokenController {

    private final CommandBusInterface commandBus;
    private final QueryBusInterface queryBus;

    AccessTokenController(CommandBusInterface commandBus, QueryBusInterface queryBus) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }

    @GetMapping
    public OpenApiResponse<Many<AccessTokenResult>> listAccessTokens() throws Exception {
        Collection<AccessTokenResult> result = this.queryBus.ask(new ListAccessTokensQuery());

        return OpenApiResponse.many(result, HttpStatus.OK);
    }

    @PostMapping
    public OpenApiResponse<Single<CreatedAccessTokenResult>> createAccessToken(@RequestBody CreateAccessTokenRequest request) throws Exception {
        Item<CreatedAccessTokenResult> result = this.queryBus.ask(new CreateAccessTokenQuery(request));

        return OpenApiResponse.one(result, HttpStatus.CREATED);
    }

    @DeleteMapping("/{tokenId}")
    public OpenApiResponse<Empty> revokeAccessToken(@PathVariable UUID tokenId) throws Exception {
        this.commandBus.handle(new RevokeAccessTokenCommand(tokenId));

        return OpenApiResponse.empty(HttpStatus.OK);
    }
}
