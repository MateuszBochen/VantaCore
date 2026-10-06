package vantaCore.application.user.domain.repository;

import vantaCore.application.role.domain.vo.RoleId;
import vantaCore.application.user.domain.UserAggregate;
import vantaCore.application.user.domain.vo.Email;
import vantaCore.application.user.domain.vo.UserId;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface UserAggregateRepositoryInterface {

    /** saving aggregate */
    void save(UserAggregate userAggregate);

    /** getting aggregate */
    UserAggregate findById(UserId id);

    /** getting aggregate */
    Optional<UserAggregate> findByEmail(Email id);

    /** Case-insensitive - for identities from outside VantaCore (SSO), whose casing of the same
     address can differ from how the account was typed in. An exact-case match wins; if several
     accounts differ only by case and none matches exactly, the result is ambiguous and empty. */
    Optional<UserAggregate> findByEmailIgnoreCase(Email email);

    /** getting aggregate */
    boolean existsByRoleId(RoleId roleId);

    /** lightweight projection of every user */
    List<UserSummary> findAllSummaries();

    /** Which of these ids currently exist - ids with no match are simply absent, not an error.
     Used to validate @mention ids parsed out of free text (comment body / ticket description)
     before notifying, without the per-id UserNotFoundException findById throws. */
    Set<UUID> findExistingIds(Set<UUID> ids);

    record UserSummary(UserId id, String firstName, String lastName, String email, String avatarUrl) {
    }
}
