package vantaCore.application.shared.infrastructure.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.exception.ForbiddenException;
import vantaCore.application.shared.domain.accessControl.Resource;

/** The RESOURCE_<code> authority check ResourceAuthorizationMiddleware runs for every
 @RequiresResource-annotated command/query, extracted so it can also be called directly by
 controllers that don't go through the command/query bus - a streaming binary response (ticket
 export CSV/ZIP) doesn't fit the Item<T>/Collection<T> QueryResult envelope, same reasoning as
 FileContentLoader, but still needs the same permission gate. */
@Component
public class ResourceAuthorizationChecker {

    private static final String AUTHORITY_PREFIX = "RESOURCE_";

    public void assertGranted(Resource resource) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String requiredAuthority = AUTHORITY_PREFIX + resource.getCode();

        boolean granted = authentication != null && authentication.getAuthorities().stream()
            .anyMatch(authority -> authority.getAuthority().equals(requiredAuthority));

        if (!granted) {
            throw new ForbiddenException(resource);
        }
    }
}
