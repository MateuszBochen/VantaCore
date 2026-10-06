package vantaCore.application.importExport.domain;

import vantaCore.application.importExport.domain.vo.ImportConnectionId;
import vantaCore.application.importExport.domain.vo.ImportProvider;

import java.time.Instant;
import java.util.UUID;

/** Write-once - a connection's token is never edited after creation, only created (mirrors
 FileAggregate). Carries the token in the clear only in memory, between the handler that just
 received it from the request and the repository adapter that encrypts it on the way to storage -
 see ImportConnectionSnapshot for the read-side (decrypted-on-the-way-out) equivalent.

 sourceProject scopes the import to one project/team-project instead of the whole Jira/Azure DevOps
 instance (JIRA JQL / AZURE_DEVOPS WIQL - see JiraImportSource/AzureDevOpsImportSource), null means
 unscoped. email is JIRA-only - Atlassian Cloud's REST API authenticates with Basic email:apiToken,
 not a bearer PAT (see JiraImportSource); always null for AZURE_DEVOPS. */
public class ImportConnectionAggregate {
    private final ImportConnectionId id;
    private final UUID projectId;
    private final ImportProvider provider;
    private final String baseUrl;
    private final String sourceProject;
    private final String email;
    private final String token;
    private final UUID createdByUserId;
    private final Instant createdAt;

    private ImportConnectionAggregate(
        ImportConnectionId id,
        UUID projectId,
        ImportProvider provider,
        String baseUrl,
        String sourceProject,
        String email,
        String token,
        UUID createdByUserId,
        Instant createdAt
    ) {
        this.id = id;
        this.projectId = projectId;
        this.provider = provider;
        this.baseUrl = baseUrl;
        this.sourceProject = sourceProject;
        this.email = email;
        this.token = token;
        this.createdByUserId = createdByUserId;
        this.createdAt = createdAt;
    }

    public static ImportConnectionAggregate newConnection(
        ImportConnectionId id,
        UUID projectId,
        ImportProvider provider,
        String baseUrl,
        String sourceProject,
        String email,
        String token,
        UUID createdByUserId,
        Instant createdAt
    ) {
        return new ImportConnectionAggregate(id, projectId, provider, baseUrl, sourceProject, email, token, createdByUserId, createdAt);
    }

    public ImportConnectionId getId() {
        return id;
    }

    public UUID getProjectId() {
        return projectId;
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

    public UUID getCreatedByUserId() {
        return createdByUserId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
