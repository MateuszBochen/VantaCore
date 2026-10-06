package vantaCore.ui.http.rest.controller.user;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.application.userSettings.appliaction.query.getAppSettings.AppSettingsResult;
import vantaCore.application.userSettings.appliaction.query.getAppSettings.GetAppSettingsQuery;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Single;

/** Unlike GET /api/user-settings (bare object, pre-existing frontend contract), this one uses the
 app's normal {id, type, resource} envelope - it's a new endpoint with no prior contract to match,
 so it follows the standard convention. */
@RestController
@RequestMapping("/api/app-settings")
final public class AppSettingsController {

    private final QueryBusInterface queryBus;

    AppSettingsController(QueryBusInterface queryBus) {
        this.queryBus = queryBus;
    }

    @GetMapping
    public OpenApiResponse<Single<AppSettingsResult>> getAppSettings() throws Exception {
        Item<AppSettingsResult> result = this.queryBus.ask(new GetAppSettingsQuery());

        return OpenApiResponse.one(result, HttpStatus.OK);
    }
}
