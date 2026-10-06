package vantaCore.application.accessToken.domain.vo;

import java.util.UUID;

public record AccessTokenId(UUID value) {

    public AccessTokenId {
        if (value == null) {
            throw new IllegalArgumentException("AccessTokenId cannot be null");
        }
    }
}
