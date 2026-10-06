package vantaCore.application.sso.infrastructure.client;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;
import vantaCore.application.sso.domain.login.SsoAuthorizationRequest;
import vantaCore.application.sso.domain.login.SsoCodeExchange;
import vantaCore.application.sso.domain.login.SsoIdentity;
import vantaCore.application.sso.domain.login.SsoProviderClientInterface;
import vantaCore.application.sso.domain.login.SsoProviderException;
import vantaCore.application.sso.domain.vo.SsoProvider;

import java.util.LinkedHashMap;
import java.util.Map;

/** GitHub OAuth Apps are plain OAuth2, not OIDC - no id_token/nonce, so the identity comes from the
 API itself using the access token. The email is the account's PRIMARY address from /user/emails
 (the /user profile email is optional and user-chosen), with its own verified flag - an unverified
 primary is rejected by SsoIdentityPolicy. No PKCE: not relied on for GitHub OAuth Apps; the
 one-time state plus the confidential client secret on the server-side exchange cover it. Note
 GitHub's token endpoint reports errors as HTTP 200 with an "error" field. */
@Component
public class GitHubSsoClient implements SsoProviderClientInterface {

    private static final String AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
    private static final String TOKEN_URL = "https://github.com/login/oauth/access_token";
    private static final String EMAILS_URL = "https://api.github.com/user/emails";

    @Override
    public SsoProvider provider() {
        return SsoProvider.GITHUB;
    }

    @Override
    public String authorizationUrl(SsoAuthorizationRequest request) {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("client_id", request.config().getClientId());
        params.put("redirect_uri", request.redirectUri());
        params.put("scope", "read:user user:email");
        params.put("state", request.state());
        params.put("allow_signup", "false");

        return SsoHttp.withQuery(AUTHORIZE_URL, params);
    }

    @Override
    public SsoIdentity exchangeCode(SsoCodeExchange exchange) {
        Map<String, String> form = new LinkedHashMap<>();
        form.put("client_id", exchange.config().getClientId());
        form.put("client_secret", exchange.config().getClientSecret());
        form.put("code", exchange.code());
        form.put("redirect_uri", exchange.redirectUri());

        JsonNode tokenResponse = SsoHttp.postForm(TOKEN_URL, form);
        String accessToken = SsoHttp.text(tokenResponse, "access_token");
        if (accessToken == null) {
            throw new SsoProviderException("GitHub token exchange failed: " + SsoHttp.text(tokenResponse, "error")
                + " " + SsoHttp.text(tokenResponse, "error_description"));
        }

        JsonNode emails = SsoHttp.getJson(EMAILS_URL, Map.of(
            "Authorization", "Bearer " + accessToken,
            "Accept", "application/vnd.github+json",
            "X-GitHub-Api-Version", "2022-11-28",
            "User-Agent", "VantaCore"
        ));

        if (emails != null && emails.isArray()) {
            for (JsonNode email : emails) {
                if (email.path("primary").asBoolean(false)) {
                    String address = SsoHttp.text(email, "email");
                    if (address == null || !address.contains("@")) {
                        break;
                    }
                    return new SsoIdentity(address.trim(), email.path("verified").asBoolean(false));
                }
            }
        }

        throw new SsoProviderException("GitHub returned no primary email");
    }
}
