package vantaCore.application.user.domain.vo;



import java.util.UUID;

public record UserId(UUID value) {


    public static UserId create() {
        return new UserId(UUID.randomUUID());
    }

    public UserId {
        if (value == null) {
            throw new IllegalArgumentException("UserId cannot be null");
        }
    }

    @Override
    public String toString() {
        return this.value.toString();
    }
}
