package vantaCore.application.security.accessToken;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import vantaCore.application.accessToken.appliaction.service.AccessTokenAuthenticator;
import vantaCore.application.accessToken.domain.vo.AccessTokenSecret;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/** Authorization: Bearer vc_pat_... - the personal-access-token counterpart of JwtAuthenticationFilter.
 Produces the SAME authentication shape (principal = user id, authorities = RESOURCE_<code>), so every
 @RequiresResource check and CurrentUserProviderInterface work unchanged for token callers; plus one
 marker authority (ACCESS_TOKEN_AUTHORITY) so the few token-forbidden actions can tell the difference
 (see CurrentUserProviderInterface.isAccessTokenSession). An invalid/expired token just leaves the
 request unauthenticated - Spring Security's authenticated() rule on /api/** then rejects it, same
 as for a bad JWT. */
public class AccessTokenAuthenticationFilter extends OncePerRequestFilter {

    public static final String ACCESS_TOKEN_AUTHORITY = "AUTH_ACCESS_TOKEN";

    private static final String BEARER_PREFIX = "Bearer ";
    private static final String RESOURCE_AUTHORITY_PREFIX = "RESOURCE_";

    private final AccessTokenAuthenticator authenticator;

    public AccessTokenAuthenticationFilter(AccessTokenAuthenticator authenticator) {
        this.authenticator = authenticator;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {

        String header = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (header != null && header.startsWith(BEARER_PREFIX)) {
            String token = header.substring(BEARER_PREFIX.length()).trim();

            if (AccessTokenSecret.looksLikeAccessToken(token)) {
                this.authenticator.authenticate(token).ifPresentOrElse(
                    authenticated -> {
                        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                        authenticated.resources().forEach(resource ->
                            authorities.add(new SimpleGrantedAuthority(RESOURCE_AUTHORITY_PREFIX + resource.getCode())));
                        authorities.add(new SimpleGrantedAuthority(ACCESS_TOKEN_AUTHORITY));

                        SecurityContextHolder.getContext().setAuthentication(
                            new UsernamePasswordAuthenticationToken(authenticated.userId().toString(), null, authorities)
                        );
                    },
                    SecurityContextHolder::clearContext
                );
            }
        }

        filterChain.doFilter(request, response);
    }
}
