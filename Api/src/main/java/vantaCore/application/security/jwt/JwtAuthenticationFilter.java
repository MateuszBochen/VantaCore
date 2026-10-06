package vantaCore.application.security.jwt;

import vantaCore.application.accessToken.domain.vo.AccessTokenSecret;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";
    private static final String RESOURCE_AUTHORITY_PREFIX = "RESOURCE_";

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {

        String header = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (header != null && header.startsWith(BEARER_PREFIX)) {
            String token = header.substring(BEARER_PREFIX.length());

            // Personal access tokens are AccessTokenAuthenticationFilter's business - parsing one as
            // a JWT would fail and clearContext() would wipe the authentication it already set.
            if (AccessTokenSecret.looksLikeAccessToken(token)) {
                filterChain.doFilter(request, response);
                return;
            }

            try {
                Claims claims = jwtService.parse(token);

                List<?> resourceCodes = claims.get("resources", List.class);
                List<SimpleGrantedAuthority> authorities = resourceCodes == null
                    ? List.of()
                    : resourceCodes.stream()
                        .map(resourceCode -> new SimpleGrantedAuthority(RESOURCE_AUTHORITY_PREFIX + resourceCode))
                        .toList();

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    claims.getSubject(),
                    null,
                    authorities
                );

                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (JwtException | IllegalArgumentException exception) {
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }
}