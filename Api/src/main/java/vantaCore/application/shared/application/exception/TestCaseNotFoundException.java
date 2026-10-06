package vantaCore.application.shared.application.exception;

import org.springframework.http.HttpStatus;
import vantaCore.application.shared.application.dto.Notification;

import java.util.List;

public class TestCaseNotFoundException extends ClientException {

    public TestCaseNotFoundException() {
        super(List.of(new Notification(
            "test-case-not-found",
            "Test case not found",
            true
        )));
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.NOT_FOUND;
    }
}
