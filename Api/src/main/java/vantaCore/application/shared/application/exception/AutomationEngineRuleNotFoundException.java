package vantaCore.application.shared.application.exception;

import org.springframework.http.HttpStatus;
import vantaCore.application.shared.application.dto.Notification;

import java.util.List;

public class AutomationEngineRuleNotFoundException extends ClientException {

    public AutomationEngineRuleNotFoundException() {
        super(List.of(new Notification(
            "automation-engine-rule-not-found",
            "Automation rule not found",
            true
        )));
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.NOT_FOUND;
    }
}
