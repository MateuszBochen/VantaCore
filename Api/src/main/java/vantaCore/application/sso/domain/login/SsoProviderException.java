package vantaCore.application.sso.domain.login;

/** A provider-side failure (unreachable, rejected the code, bad/unverifiable id_token, no email) -
 the message is for logs only; clients just see sso-provider-error. */
public class SsoProviderException extends RuntimeException {

    public SsoProviderException(String message) {
        super(message);
    }

    public SsoProviderException(String message, Throwable cause) {
        super(message, cause);
    }
}
