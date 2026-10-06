package vantaCore.application.role.appliaction.service;

import org.springframework.stereotype.Component;
import vantaCore.application.role.domain.RoleAggregate;
import vantaCore.application.role.domain.repository.RoleAggregateRepositoryInterface;
import vantaCore.application.role.domain.vo.RoleId;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/** Expands a user's role ids into the flat set of resource codes they grant - a system role
 grants every currently-defined resource, including ones added after the role was assigned. */
@Component
public class EffectiveResourceResolver {

    private final RoleAggregateRepositoryInterface repository;

    public EffectiveResourceResolver(RoleAggregateRepositoryInterface repository) {
        this.repository = repository;
    }

    public Set<String> resolve(Set<RoleId> roleIds) {
        List<RoleAggregate> roles = this.repository.findAllById(roleIds);

        boolean grantsEverything = roles.stream().anyMatch(RoleAggregate::isSystem);
        if (grantsEverything) {
            return Arrays.stream(Resource.values()).map(Resource::getCode).collect(Collectors.toSet());
        }

        return roles.stream()
            .flatMap(role -> role.getResources().stream())
            .map(Resource::getCode)
            .collect(Collectors.toSet());
    }
}
