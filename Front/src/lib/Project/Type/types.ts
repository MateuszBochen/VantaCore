import type {CollectionResponse} from '@/lib/Request/Type/types';

// Project-level, shared across every issue type - pure identity, no
// transitions (see WorkflowStatus for those). Was IssueType-owned
// (`IssueStatus`, each type had its own copy with its own id even for the
// same conceptual "Done") until the Status & Workflow Model sub-project -
// see that sub-project's ADR for why this split exists.
export type Status = {
  id: string;
  name: string;
  color: string;
  isDone: boolean;
};

// Kept as an alias, not a fresh type - every existing `IssueStatus` import
// across the app already means exactly this shape.
export type IssueStatus = Status;

// One issue type's own workflow: which shared Status ids it uses, and the
// transition graph between them. `statusId` references Project.statuses,
// not a type-owned object.
export type WorkflowStatus = {
  statusId: string;
  allowedTransitionIds: string[];
};

export type IssueType = {
  id: string;
  name: string;
  color: string;
  estimable: boolean;
  workflow: WorkflowStatus[];
  initialStatusId: string | null;
  childTypeIds: string[];
  // Starting content for a NEW ticket of this type - createDraftTicket seeds
  // title/description from these, and TicketEditor re-applies them if the
  // user switches a still-blank draft's type after the fact (see its own
  // issue-type Select). Never touched once a ticket has any real content -
  // this is a one-time starting point, not a live-synced template. Empty
  // string = no template, same as not having one.
  titleTemplate: string;
  descriptionTemplate: string;
};

export type AutomationRule = {
  id: string;
  parentTypeId: string;
  setParentStatusId: string;
};

// A managed catalog entry for ticket flags (e.g. "Blocked", "At Risk") - unlike
// tags, flags are defined here in Project settings so filtering/reporting can
// rely on a consistent, colored vocabulary instead of free text.
export type Flag = {
  id: string;
  name: string;
  color: string;
};

export type CustomFieldType = 'text' | 'number' | 'select' | 'date' | 'time' | 'dateTime' | 'checkbox' | 'user';

// Global per-Project, not per-IssueType - one shared set of custom fields
// applies to every ticket type in the project. `options` only applies to
// (and is only ever set for) the 'select' type; `multiple` only for 'user'
// (a single field toggles between holding one user id or an array of them).
export type CustomFieldDefinition = {
  id: string;
  name: string;
  type: CustomFieldType;
  options?: string[];
  multiple?: boolean;
};

// Platform Documentation's relational categories form one drill-down chain:
// a Domain contains BoundedContexts, a BoundedContext contains Components.
// Edges at each level are scoped to siblings under the same parent (e.g. a
// BoundedContextEdge only ever connects two contexts within the same domain).
export type DocGraphEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

// `description` on every entity below is free-text substance (responsibilities,
// business rules, invariants) meant to eventually be indexed for generative/
// AI search over the platform docs - the graph alone only carries structure
// (what's connected to what), not anything worth retrieving on its own.
export type Domain = {
  id: string;
  name: string;
  color: string;
  description?: string;
};

export type BoundedContext = {
  id: string;
  name: string;
  color: string;
  domainId: string;
  description?: string;
};

export type Component = {
  id: string;
  name: string;
  color: string;
  boundedContextId: string;
  description?: string;
};

export type DataFlowNode = {
  id: string;
  name: string;
  color: string;
  componentId: string;
  description?: string;
};

// Infrastructure is a separate, parallel graph (deployment view) with its own
// two-level drill-down (cluster -> services) - not nested under the domains
// chain above, since infra topology doesn't map 1:1 to domain decomposition.
export type InfraCluster = {
  id: string;
  name: string;
  color: string;
  description?: string;
};

export type InfraService = {
  id: string;
  name: string;
  color: string;
  clusterId: string;
  description?: string;
};

export type PlatformDocumentation = {
  architectureOverview: string;
  api: string;
  domains: Domain[];
  domainEdges: DocGraphEdge[];
  boundedContexts: BoundedContext[];
  boundedContextEdges: DocGraphEdge[];
  components: Component[];
  componentEdges: DocGraphEdge[];
  dataFlowNodes: DataFlowNode[];
  dataFlowEdges: DocGraphEdge[];
  infraClusters: InfraCluster[];
  infraClusterEdges: DocGraphEdge[];
  infraServices: InfraService[];
  infraServiceEdges: DocGraphEdge[];
};

// POST /api/project/:id/documentation/ask - generative Q&A over everything
// indexed from this project's docs (Platform Docs entity descriptions/
// architectureOverview/api, plus each sub-project's ADRs/scope/impact
// analysis/solution design). `projectId` is the main project's id (same one
// this whole page is already scoped to); `sourceId` is the sub-project's id
// for every SUB_PROJECT_* sourceType, null for the two project-level types
// (architectureOverview/api, which have no sub-project to point at).
export type DocumentationAskSource = {
  sourceType: string;
  sourceId: string | null;
  projectId: string;
  label: string;
  excerpt: string;
};

export type DocumentationAskAnswer = {
  answer: string;
  sources: DocumentationAskSource[];
};

// A single past snapshot from GET /api/project/:id/documentation/history -
// same shape as PlatformDocumentation plus who/when saved it, for the
// read-only history viewer.
export type PlatformDocumentationVersion = PlatformDocumentation & {
  versionId: string;
  changedByUserId: string;
  changedByEmail: string;
  changedAt: string;
};

// Project Documentation's four doc types per sub-project - scope/impact-analysis
// /solution-design are single markdown+mermaid docs, adr is a numbered list of
// them (see Adr below), per the agreed Documentation tab concept.
export type Adr = {
  id: string;
  title: string;
  content: string;
};

export type SubProjectDocumentation = {
  scope: string;
  impactAnalysis: string;
  solutionDesign: string;
  adrs: Adr[];
};

export type SubProject = {
  id: string;
  name: string;
  documentation: SubProjectDocumentation;
};

// A single past (or current) snapshot from GET /api/project/:projectId/sub-project/:id
// or its /history counterpart - same envelope both times, just constrained to
// strictly-older versions on the history endpoint (see useGetSubProjectHistoryHook).
export type SubProjectVersion = SubProject & {
  status: string;
  versionId: string;
  changedByUserId: string;
  changedByEmail: string;
  changedAt: string;
};

// Lightweight shape used for the sidebar/menu list - the list endpoint
// doesn't return `documentation`, only enough to render a menu entry and
// link into the full sub-project.
export type SubProjectSummary = {
  id: string;
  name: string;
  status: string;
};

export type Project = {
  id: string;
  name: string;
  prefix: string;
  startingNumber: number;
  // Free-text label (e.g. "h", "SP", "days") for whatever unit tickets are
  // estimated in on this project - purely a display suffix next to the
  // Estimate field (see TicketFieldsSidebar), no conversion/validation
  // attached to it since different teams estimate differently.
  estimateUnit: string;
  // Project-level shared status pool - see the Status & Workflow Model
  // sub-project. Every IssueType.workflow[].statusId references an entry
  // here.
  statuses: Status[];
  issueTypes: IssueType[];
  automationRules: AutomationRule[];
  flags: Flag[];
  customFieldDefinitions: CustomFieldDefinition[];
  platformDocumentation: PlatformDocumentation;
  subProjects: SubProjectSummary[];
};

export type SaveProjectErrorItem = {
  id: string;
  resource: {
    code: string;
    message: string;
    isBlocked: boolean;
  };
};

export type SaveProjectErrorResponse = CollectionResponse<SaveProjectErrorItem>;

export type SaveProjectResult =
  | {success: true}
  | {success: false; errors: SaveProjectErrorItem[]};

export type GetProjectResponse = {
  id: string;
  type: string;
  resource: Project;
};

export type GetProjectResult =
  | {success: true; project: Project}
  | {success: false};

// Lightweight shape used for the project list/sidebar - the list endpoint
// doesn't return full Project objects (issue types, hierarchy, etc.), only
// enough to render a menu entry and link into the full project.
export type ProjectSummary = {
  id: string;
  name: string;
};

export type ListProjectsResponseItem = {
  id: string;
  resource: ProjectSummary;
};

export type ListProjectsResponse = CollectionResponse<ListProjectsResponseItem>;

export type ListProjectsResult =
  | {success: true; projects: ProjectSummary[]}
  | {success: false};

export type ListSubProjectsResponseItem = {
  id: string;
  resource: SubProjectSummary;
};

export type ListSubProjectsResponse = CollectionResponse<ListSubProjectsResponseItem>;

// The envelope GET /api/project/:projectId/sub-project/:id and its /history
// counterpart both return - unlike PlatformDocumentation's "live" endpoint,
// the sub-project resource always carries version metadata, even for the
// current version.
export type SubProjectResource = {
  versionId: string;
  subProjectId: string;
  projectId: string;
  name: string;
  status: string;
  documentation: SubProjectDocumentation;
  changedByUserId: string;
  changedByEmail: string;
  changedAt: string;
};

export type GetSubProjectResponse = {
  id: string;
  type: string;
  resource: SubProjectResource;
};

export type GetSubProjectResult =
  | {success: true; subProject: SubProjectVersion}
  | {success: false};
