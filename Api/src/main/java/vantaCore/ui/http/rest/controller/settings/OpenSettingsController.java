package vantaCore.ui.http.rest.controller.settings;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.application.userSettings.appliaction.query.getOpenSettings.GetOpenSettingsQuery;
import vantaCore.application.userSettings.appliaction.query.getOpenSettings.OpenSettingsResult;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Single;

/** Deliberately under /web-api (permitAll, see SecurityConfig) - the login page needs these before
 there's any token, e.g. to know which SSO buttons to render. The authenticated counterpart with
 per-user data is GET /api/app-settings. */
@RestController
@RequestMapping("/web-api/open-settings")
final public class OpenSettingsController {

    private final QueryBusInterface queryBus;

    OpenSettingsController(QueryBusInterface queryBus) {
        this.queryBus = queryBus;
    }

    @GetMapping
    public OpenApiResponse<Single<OpenSettingsResult>> getOpenSettings() throws Exception {
        Item<OpenSettingsResult> result = this.queryBus.ask(new GetOpenSettingsQuery());

        return OpenApiResponse.one(result, HttpStatus.OK);
    }
}
