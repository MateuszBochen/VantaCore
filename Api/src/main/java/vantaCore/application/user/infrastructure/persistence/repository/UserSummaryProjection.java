package vantaCore.application.user.infrastructure.persistence.repository;

import java.util.UUID;

public interface UserSummaryProjection {

    UUID getId();

    String getFirstName();

    String getLastName();

    String getEmail();

    String getAvatarUrl();
}