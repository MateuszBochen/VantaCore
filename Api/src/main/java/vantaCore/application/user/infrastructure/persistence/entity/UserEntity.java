package vantaCore.application.user.infrastructure.persistence.entity;

import jakarta.persistence.*;
import vantaCore.application.role.domain.vo.RoleId;
import vantaCore.application.user.domain.UserAggregate;
import vantaCore.application.user.domain.vo.*;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Entity
@Table(name = "users")
public class UserEntity {
    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    private String avatarUrl;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "user_role_assignments",
            joinColumns = @JoinColumn(name = "user_id")
    )
    @Column(name = "role_id")
    private Set<UUID> roleIds = new HashSet<>();

    // Hibernate requires it
    protected UserEntity() {}

    private UserEntity(
        UUID id,
        String email,
        String password,
        String firstName,
        String lastName,
        String avatarUrl,
        Set<UUID> roleIds
    ) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.avatarUrl = avatarUrl;
        this.roleIds = roleIds;
    }

    public static UserEntity fromDomain(UserAggregate user) {
        return new UserEntity(
            user.getId().value(),
            user.getCredentials().email().value(),
            user.getCredentials().password().getPassword(),
            user.getProfile().firstName(),
            user.getProfile().lastName(),
            user.getProfile().avatarUrl(),
            user.getRoleIds().stream().map(RoleId::value).collect(Collectors.toSet())
        );
    }

    public UserAggregate toDomain() {
        return new UserAggregate(
            new UserId(id),
            new UserCredentials(
                    new Email(email),
                    Password.fromHash(password)
            ),
            new UserProfile(
                firstName,
                lastName,
                avatarUrl
            ),
            this.roleIds.stream().map(RoleId::new).collect(Collectors.toSet())
        );
    }

    // getters (optional)
    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public Set<UUID> getRoleIds() { return roleIds; }
}
