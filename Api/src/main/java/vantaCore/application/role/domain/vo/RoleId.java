package vantaCore.application.role.domain.vo;

import java.util.UUID;

public record RoleId(UUID value) {

    public static RoleId create() {
        return new RoleId(UUID.randomUUID());
    }

    public RoleId {
        if (value == null) {
            throw new IllegalArgumentException("RoleId cannot be null");
        }
    }

    @Override
    public String toString() {
        return this.value.toString();
    }
}
