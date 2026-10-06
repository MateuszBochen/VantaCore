package vantaCore.ui.http.rest.controller.auth;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.user.appliaction.dto.LoginRequest;
import vantaCore.application.user.appliaction.query.login.LoginQuery;
import vantaCore.application.user.appliaction.query.login.LoginResult;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Single;

@RestController
@RequestMapping("/web-api/auth")
final public class AuthController {

    private final QueryBusInterface queryBus;

    AuthController(QueryBusInterface queryBus) {
        this.queryBus = queryBus;
    }

    @PostMapping("/login")
    public OpenApiResponse<Single<LoginResult>> login(
        @RequestBody LoginRequest request
    ) throws Exception {

        LoginQuery query = new LoginQuery(request);
        Item<LoginResult> result = this.queryBus.ask(query);

        return OpenApiResponse.one(result, HttpStatus.OK);
    }
}