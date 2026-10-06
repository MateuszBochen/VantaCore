package vantaCore.application.user.appliaction.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

final public class UpdateUserRequest {

    @Email
    @NotBlank
    private final String email;
    @NotBlank
    private final String firstName;
    @NotBlank
    private final String lastName;

    public UpdateUserRequest(String email, String firstName, String lastName) {
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }
}
