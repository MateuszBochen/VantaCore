package vantaCore.application.importExport.domain.source;

/** targetSourceKey is the linked record's own sourceKey (Jira issue key, Azure DevOps work item id)
 - resolvable to a ticket only if that record is part of the same import. */
public record ImportSourceLink(String targetSourceKey, ImportLinkType type) {
}
