package vantaCore.application.user.appliaction.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

final public class CreateAdminRequest {

    @Email
    @NotBlank
    private final String email;
    @NotBlank
    private final String password;
    @NotBlank
    private final String firstName;
    @NotBlank
    private final String lastName;

    public CreateAdminRequest(String email, String password, String firstName, String lastName) {
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }
}
