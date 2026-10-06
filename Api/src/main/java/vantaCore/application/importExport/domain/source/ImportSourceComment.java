package vantaCore.application.importExport.domain.source;

import java.time.Instant;

/** One external comment fetched from the source system (Jira/Azure DevOps) - see
 ImportJobRunner.importComments for how this becomes a real ticket comment. authorName is whatever
 display name the source system returns; VantaCore doesn't try to match it to an existing user
 account (unlike ImportMappingApplier's assignee matching by email) - there's no reliable way to
 resolve "whoever wrote this Jira/Azure DevOps comment" to a VantaCore account, so the comment is
 created under whoever ran the import instead (same "reads as created by whoever ran the import"
 convention as an imported ticket/attachment - see ImportJobSecurityContext), with the original
 author/date preserved as a text header so that context isn't silently lost. */
public record ImportSourceComment(String authorName, String body, Instant createdAt) {
}
