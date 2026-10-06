package vantaCore.application.user.domain;

import vantaCore.application.role.domain.vo.RoleId;
import vantaCore.application.user.domain.vo.Password;
import vantaCore.application.user.domain.vo.UserCredentials;
import vantaCore.application.user.domain.vo.UserId;
import vantaCore.application.user.domain.vo.UserProfile;

import java.util.Set;

public class UserAggregate {
    private final UserId id;
    private final UserCredentials credentials;
    private final UserProfile profile;
    private final Set<RoleId> roleIds;

    public UserAggregate(
            UserId id,
            UserCredentials credentials,
            UserProfile profile,
            Set<RoleId> roleIds
    ) {
        this.id = id;
        this.credentials = credentials;
        this.profile = profile;
        this.roleIds = roleIds;
    }

    public UserId getId() {
        return this.id;
    }

    public UserCredentials getCredentials() {
        return credentials;
    }

    public UserProfile getProfile() {
        return profile;
    }

    public Set<RoleId> getRoleIds() {
        return roleIds;
    }

    /** Same user with a new password - email/profile/roles carry over. The caller checks
     ChangePasswordPolicy first; this only swaps the (already hashed) credential. */
    public UserAggregate withPassword(Password password) {
        return new UserAggregate(this.id, new UserCredentials(this.credentials.email(), password), this.profile, this.roleIds);
    }
}
