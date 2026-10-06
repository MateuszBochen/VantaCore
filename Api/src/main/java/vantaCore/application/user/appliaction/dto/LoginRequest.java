package vantaCore.application.user.appliaction.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

final public class LoginRequest {

    @Email
    @NotBlank
    private final String email;
    @NotBlank
    private final String password;

    public LoginRequest(String email, String password) {
        this.email = email;
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }
}