package vantaCore.application.sso.domain.login;

import vantaCore.application.sso.domain.vo.SsoProvider;

import java.util.Locale;

/** The only redirect_uri VantaCore will ever hand to a provider: {frontUrl}/login/sso/{provider}.
 Anything else is refused - otherwise a crafted authorize link could send the victim's
 authorization code to a site the attacker controls. frontUrl comes from environment config
 (app.front-url), passed in by the caller since the domain doesn't read configuration itself. */
public final class SsoRedirectUri {

    private SsoRedirectUri() {
    }

    public static String expected(String frontUrl, SsoProvider provider) {
        String base = frontUrl.endsWith("/") ? frontUrl.substring(0, frontUrl.length() - 1) : frontUrl;
        return base + "/login/sso/" + provider.name().toLowerCase(Locale.ROOT);
    }

    public static boolean isAllowed(String frontUrl, SsoProvider provider, String redirectUri) {
        return redirectUri != null && redirectUri.equals(expected(frontUrl, provider));
    }
}
