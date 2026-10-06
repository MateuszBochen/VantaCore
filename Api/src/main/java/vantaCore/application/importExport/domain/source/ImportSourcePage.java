package vantaCore.application.importExport.domain.source;

import java.util.List;

/** nextPageToken null means this was the last page - see ExternalImportSourceInterface.fetchPage.
 totalCount is the total number of records across ALL pages when the provider knows it upfront
 (Azure DevOps - its WIQL query returns every id anyway), null when it doesn't (Jira's
 /search/jql has no total) - lets ImportJobRunner report real progress instead of a coarse
 per-page estimate. */
public record ImportSourcePage(List<ImportSourceRecord> records, String nextPageToken, Integer totalCount) {
}
