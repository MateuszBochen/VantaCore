package vantaCore.application.user.appliaction.query.login;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.user.appliaction.dto.LoginRequest;

final public class LoginQuery {
    @Valid
    @NotNull
    private final LoginRequest loginRequest;

    public LoginQuery(LoginRequest loginRequest) {
        this.loginRequest = loginRequest;
    }

    public LoginRequest getLoginRequest() {
        return loginRequest;
    }
}