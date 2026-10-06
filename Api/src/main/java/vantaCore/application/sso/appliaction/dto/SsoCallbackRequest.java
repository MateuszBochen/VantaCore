package vantaCore.application.sso.appliaction.dto;

import jakarta.validation.constraints.NotBlank;

/** Body of POST /web-api/auth/sso/{provider}/callback - the ?code&state the provider appended to the
 front route, plus that route itself (must match what authorize was called with). */
final public class SsoCallbackRequest {

    @NotBlank
    private final String code;

    @NotBlank
    private final String state;

    @NotBlank
    private final String redirectUri;

    public SsoCallbackRequest(String code, String state, String redirectUri) {
        this.code = code;
        this.state = state;
        this.redirectUri = redirectUri;
    }

    public String getCode() {
        return code;
    }

    public String getState() {
        return state;
    }

    public String getRedirectUri() {
        return redirectUri;
    }
}
