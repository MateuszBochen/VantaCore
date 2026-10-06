import {Navigate, Route, Routes} from 'react-router-dom';
import ProjectsListPage from './ProjectsListPage';
import ProjectOverview from './ProjectOverview';
import ProjectSettings from './ProjectSettings';
import TicketsPage from './Tickets/TicketsPage';
import TicketPage from './Tickets/TicketPage';
import DocumentationLayout from './Documentation/DocumentationPage';
import PlatformDocumentationPage from './Documentation/PlatformDocumentationPage';
import AskAiPage from './Documentation/AskAiPage';
import SubProjectDocumentationPage from './Documentation/SubProjectDocumentationPage';
import VersionTrackerPage from './VersionTracker/VersionTrackerPage';
import AutomationRuleEditorPage from './AutomationRules/AutomationRuleEditorPage';
import AuditLogPage from './AuditLog/AuditLogPage';

// Owns everything under /projects/* so WorkPlace doesn't need to know about
// the project module's internal routes.
const ProjectRoutes = () => (
  <Routes>
    {/* No API call happens just from visiting this route - ProjectSettings
        starts from a local, unsaved draft and only creates the project once
        the user submits a step. */}
    <Route index element={<ProjectsListPage />} />
    <Route path="new" element={<ProjectSettings isNew />} />
    <Route path=":projectId" element={<ProjectOverview />} />
    <Route path=":projectId/tickets" element={<TicketsPage />} />
    <Route path=":projectId/tickets/new" element={<TicketPage isNew />} />
    <Route path=":projectId/tickets/:ticketId" element={<TicketPage />} />
    <Route path=":projectId/settings" element={<ProjectSettings />} />
    <Route path=":projectId/version-tracker" element={<VersionTrackerPage />} />
    <Route path=":projectId/audit-log" element={<AuditLogPage />} />
    <Route path=":projectId/automation-rules/new" element={<AutomationRuleEditorPage isNew />} />
    <Route path=":projectId/automation-rules/:ruleId" element={<AutomationRuleEditorPage />} />
    <Route path=":projectId/documentation" element={<DocumentationLayout />}>
      <Route index element={<Navigate to="platform" replace />} />
      <Route path="platform" element={<PlatformDocumentationPage />} />
      <Route path="ask-ai" element={<AskAiPage />} />
      {/* Same deferred-create pattern as /projects/new - nested here (rather
          than a standalone route like the old CreateSubProjectRedirect) so it
          can read the already-loaded project from DocumentationLayout's
          outlet context instead of fetching it again on its own. */}
      <Route path="sub-projects/new" element={<SubProjectDocumentationPage isNew />} />
      <Route path="sub-projects/:subProjectId" element={<SubProjectDocumentationPage />} />
    </Route>
  </Routes>
);

export default ProjectRoutes;
