package vantaCore.ui.http.rest.controller.user;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.application.user.appliaction.query.getUser.GetUserQuery;
import vantaCore.application.user.appliaction.query.getUser.UserResult;
import vantaCore.application.user.appliaction.query.listUsers.ListUsersQuery;
import vantaCore.application.user.appliaction.query.listUsers.UserSummaryResult;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Many;
import vantaCore.ui.http.rest.response.dto.Single;

import java.util.UUID;

@RestController
@RequestMapping("/api/user")
final public class UserQueryController {

    private final QueryBusInterface queryBus;

    UserQueryController(QueryBusInterface queryBus) {
        this.queryBus = queryBus;
    }

    @GetMapping
    public OpenApiResponse<Many<UserSummaryResult>> listUsers() throws Exception {

        ListUsersQuery query = new ListUsersQuery();
        Collection<UserSummaryResult> result = this.queryBus.ask(query);

        return OpenApiResponse.many(result, HttpStatus.OK);
    }

    @GetMapping("/{userId}")
    public OpenApiResponse<Single<UserResult>> getUser(
        @PathVariable UUID userId
    ) throws Exception {

        Item<UserResult> result = this.queryBus.ask(new GetUserQuery(userId));

        return OpenApiResponse.one(result, HttpStatus.OK);
    }
}