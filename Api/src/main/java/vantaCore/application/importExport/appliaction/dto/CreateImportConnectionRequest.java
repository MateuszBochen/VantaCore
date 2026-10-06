package vantaCore.application.importExport.appliaction.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.importExport.domain.vo.ImportProvider;

final public class CreateImportConnectionRequest {

    @NotNull
    private final ImportProvider provider;

    @NotBlank
    private final String baseUrl;

    /** Scopes the import to one project/team-project instead of the whole instance - optional,
     null/blank means unscoped. */
    private final String sourceProject;

    /** JIRA only - Atlassian Cloud authenticates with Basic email:apiToken, not a bearer PAT (see
     JiraImportSource). Ignored for AZURE_DEVOPS. */
    private final String email;

    @NotBlank
    private final String token;

    public CreateImportConnectionRequest(ImportProvider provider, String baseUrl, String sourceProject, String email, String token) {
        this.provider = provider;
        this.baseUrl = baseUrl;
        this.sourceProject = sourceProject;
        this.email = email;
        this.token = token;
    }

    public ImportProvider getProvider() {
        return provider;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public String getSourceProject() {
        return sourceProject;
    }

    public String getEmail() {
        return email;
    }

    public String getToken() {
        return token;
    }
}
