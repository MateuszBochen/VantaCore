package vantaCore.ui.http.rest.controller.user;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.application.userSettings.appliaction.command.saveUserSettings.SaveUserSettingsCommand;
import vantaCore.application.userSettings.appliaction.query.getUserSettings.GetUserSettingsQuery;

import java.util.Map;

/** Deliberately returns/accepts the raw settings blob, not the app's usual {id, type, resource}
 envelope - this pre-dates the backend (the frontend already shipped GET/PUT /api/user-settings
 against a bare JSON object contract, see Front's UserSettings/Type/types.ts and
 useGetUserSettingsHook/useSaveUserSettingsHook), so the backend matches that existing contract
 rather than the other way around. */
@RestController
@RequestMapping("/api/user-settings")
final public class UserSettingsController {

    private final CommandBusInterface commandBus;
    private final QueryBusInterface queryBus;

    UserSettingsController(CommandBusInterface commandBus, QueryBusInterface queryBus) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getUserSettings() throws Exception {
        Item<Map<String, Object>> result = this.queryBus.ask(new GetUserSettingsQuery());

        return ResponseEntity.ok(result.resource());
    }

    @PutMapping
    public ResponseEntity<Void> saveUserSettings(@RequestBody Map<String, Object> settings) throws Exception {
        this.commandBus.handle(new SaveUserSettingsCommand(settings));

        return ResponseEntity.ok().build();
    }
}
