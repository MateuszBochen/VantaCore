// See the Import / Export sub-project's Solution Design + ADRs (Catch up
// with Jira project) for the full contract this module implements against.
export type ImportProvider = 'CSV' | 'JIRA' | 'AZURE_DEVOPS';

// Only Jira/Azure DevOps need a live connection (base URL + token) before an
// import can run - CSV works straight off the uploaded file, no connection
// step (see the "pull from source API, not an uploaded export file" ADR).
export type ImportConnectionProvider = Extract<ImportProvider, 'JIRA' | 'AZURE_DEVOPS'>;

export type ImportConnection = {
  id: string;
  provider: ImportConnectionProvider;
  baseUrl: string;
};

// 'issueType'/'status' aren't free text - see ImportValueMapping below for
// how each *distinct value* found in whichever source field is mapped here
// gets resolved to a real IssueType/Status id.
export type ImportTargetField = 'title' | 'description' | 'issueType' | 'status' | 'priority' | 'assignee' | `custom:${string}`;

export type ImportFieldMapping = {
  sourceField: string;
  targetField: ImportTargetField;
};

// A separate mapping from ImportFieldMapping: that one says *which column*
// holds issue-type/status text, this one says what each distinct value found
// in that column (e.g. Jira's "Bug", "In Progress") corresponds to in this
// project. `targetId` is an IssueType.id or a Status.id depending on which
// target field `sourceValue` was collected from.
export type ImportValueMapping = {
  sourceValue: string;
  targetId: string;
};

export type ImportPreview = {
  fields: string[];
  rows: Record<string, string>[];
  fieldValues?: Record<string, string[]>;
};

export type ImportJobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export type ImportJobReportRow = {
  rowNumber: number;
  outcome: 'CREATED' | 'SKIPPED' | 'FAILED';
  ticketKey: string | null;
  message: string | null;
};

export type ImportJobReport = {
  createdCount: number;
  skippedCount: number;
  failedCount: number;
  // Attachments over the 25MB per-file limit are skipped, not a hard
  // failure for the whole ticket - see the sub-project's Impact Analysis.
  skippedAttachmentsCount: number;
  rows: ImportJobReportRow[];
};

export type ImportJob = {
  id: string;
  status: ImportJobStatus;
  progress: number;
  report: ImportJobReport | null;
};

export type ExportTicketFilters = {
  issueTypeIds: string[];
  statusIds: string[];
};
