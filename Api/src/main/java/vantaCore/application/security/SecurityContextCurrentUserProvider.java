package vantaCore.application.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import vantaCore.application.security.accessToken.AccessTokenAuthenticationFilter;
import vantaCore.application.shared.application.exception.AuthenticationFailedException;
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;
import vantaCore.application.user.domain.vo.UserId;

import java.util.UUID;

@Component
public class SecurityContextCurrentUserProvider implements CurrentUserProviderInterface {

    @Override
    public UserId getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getName() == null) {
            throw new AuthenticationFailedException();
        }

        return new UserId(UUID.fromString(authentication.getName()));
    }

    @Override
    public boolean isAccessTokenSession() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        return authentication != null && authentication.getAuthorities().stream()
            .anyMatch(authority -> AccessTokenAuthenticationFilter.ACCESS_TOKEN_AUTHORITY.equals(authority.getAuthority()));
    }
}
