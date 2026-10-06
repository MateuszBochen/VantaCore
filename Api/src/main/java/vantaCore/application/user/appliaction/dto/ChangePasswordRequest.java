package vantaCore.application.user.appliaction.dto;

import jakarta.validation.constraints.NotBlank;

/** Body of PUT /api/user/me/password - strength rules live in ChangePasswordPolicy, not here. */
final public class ChangePasswordRequest {

    @NotBlank
    private final String currentPassword;

    @NotBlank
    private final String newPassword;

    public ChangePasswordRequest(String currentPassword, String newPassword) {
        this.currentPassword = currentPassword;
        this.newPassword = newPassword;
    }

    public String getCurrentPassword() {
        return currentPassword;
    }

    public String getNewPassword() {
        return newPassword;
    }
}
