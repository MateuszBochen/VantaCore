// Every owner (ticket, sub-project, project-level platform documentation)
// exposes the same {basePath}/attachment[/{id}][/download] shape, just with
// a different basePath - see each module's own glue for how that's built:
//   ticket:         /api/project/{projectId}/ticket/{ticketId}
//   sub-project:    /api/project/{projectId}/sub-project/{subProjectId}
//   documentation:  /api/project/{projectId}/documentation
// (Documentation has no id segment of its own - platform docs are 1:1 with
// the project, so projectId alone is the owner.)

export const attachmentListPath = (basePath: string): string => `${basePath}/attachment`;

export const attachmentPath = (basePath: string, attachmentId: string): string => `${basePath}/attachment/${attachmentId}`;

export const attachmentDownloadPath = (basePath: string, attachmentId: string): string => `${attachmentPath(basePath, attachmentId)}/download`;
