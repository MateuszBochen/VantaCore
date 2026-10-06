package vantaCore.application.accessToken.appliaction.service;

import org.springframework.stereotype.Component;
import vantaCore.application.role.appliaction.service.EffectiveResourceResolver;
import vantaCore.application.shared.domain.accessControl.Resource;
import vantaCore.application.user.domain.UserAggregate;

import java.util.EnumSet;
import java.util.Set;

/** A user's current resources as Resource values - EffectiveResourceResolver works in wire codes
 (what goes into a JWT); codes no longer in the Resource enum are simply skipped. Read-only
 cross-module lookup into role, see CLAUDE.md. */
@Component
public class UserResourceLookup {

    private final EffectiveResourceResolver effectiveResourceResolver;

    public UserResourceLookup(EffectiveResourceResolver effectiveResourceResolver) {
        this.effectiveResourceResolver = effectiveResourceResolver;
    }

    public Set<Resource> resourcesOf(UserAggregate user) {
        Set<Resource> resources = EnumSet.noneOf(Resource.class);
        for (String code : this.effectiveResourceResolver.resolve(user.getRoleIds())) {
            try {
                resources.add(Resource.fromCode(code));
            } catch (IllegalArgumentException exception) {
                // stale code - ignore
            }
        }
        return resources;
    }
}
