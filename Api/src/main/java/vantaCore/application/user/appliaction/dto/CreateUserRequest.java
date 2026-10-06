package vantaCore.application.user.appliaction.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Set;
import java.util.UUID;

final public class CreateUserRequest {

    @Email
    @NotBlank
    private final String email;
    @NotBlank
    private final String password;
    @NotBlank
    private final String firstName;
    @NotBlank
    private final String lastName;
    @NotNull
    private final Set<UUID> roleIds;

    public CreateUserRequest(String email, String password, String firstName, String lastName, Set<UUID> roleIds) {
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.roleIds = roleIds;
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

    public Set<UUID> getRoleIds() {
        return roleIds;
    }
}
