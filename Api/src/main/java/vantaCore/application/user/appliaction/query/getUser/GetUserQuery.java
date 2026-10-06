package vantaCore.application.user.appliaction.query.getUser;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.USER_VIEW)
final public class GetUserQuery {

    @NotNull
    private final UUID userId;

    public GetUserQuery(UUID userId) {
        this.userId = userId;
    }

    public UUID getUserId() {
        return userId;
    }
}
