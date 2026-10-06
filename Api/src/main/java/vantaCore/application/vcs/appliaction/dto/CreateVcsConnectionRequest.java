package vantaCore.application.vcs.appliaction.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.vcs.domain.vo.VcsProvider;

final public class CreateVcsConnectionRequest {

    @NotNull
    private final VcsProvider provider;

    @NotBlank
    private final String repoUrl;

    public CreateVcsConnectionRequest(VcsProvider provider, String repoUrl) {
        this.provider = provider;
        this.repoUrl = repoUrl;
    }

    public VcsProvider getProvider() {
        return provider;
    }

    public String getRepoUrl() {
        return repoUrl;
    }
}
