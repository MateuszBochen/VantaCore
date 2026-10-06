import useListProjectsHook from '../Project/useListProjectsHook';
import useGetProjectHook from '../Project/useGetProjectHook';
import type {NotificationSummary} from './Type/types';

const asString = (value: unknown): string | null => (typeof value === 'string' ? value : null);

// Only 2 notification types exist server-side right now (see
// CreateNotificationWhenCommentWasAdded/CreateNotificationWhenNewTicketWasCreated
// in the Api repo) - both point at a ticket, but only TICKET_ASSIGNED's
// payload carries `projectId` directly. COMMENT_ADDED only has `ticketId`/
// `ticketKey`, and every ticket route needs a projectId (no project-less
// GET /api/ticket/{id} exists) - resolved client-side instead of asking
// backend to add the field, by matching ticketKey's prefix (e.g. "VC" in
// "VC-1027") against each project's own `prefix`.
const useResolveNotificationLinkHook = () => {
  const {listProjects} = useListProjectsHook();
  const {getProject} = useGetProjectHook();

  const resolveProjectIdByTicketKey = async (ticketKey: string): Promise<string | null> => {
    const prefix = ticketKey.split('-')[0];
    const projectsResult = await listProjects();

    if (!projectsResult.success) {
      return null;
    }

    const projects = await Promise.all(projectsResult.projects.map((summary) => getProject(summary.id)));
    const match = projects.find((result) => result.success && result.project.prefix === prefix);

    return match?.success ? match.project.id : null;
  };

  const resolveNotificationLink = async (notification: NotificationSummary): Promise<string | null> => {
    const ticketId = asString(notification.payload.ticketId);

    if (!ticketId) {
      return null;
    }

    if (notification.type === 'TICKET_ASSIGNED') {
      const projectId = asString(notification.payload.projectId);
      return projectId ? `/projects/${projectId}/tickets/${ticketId}` : null;
    }

    if (notification.type === 'COMMENT_ADDED') {
      const ticketKey = asString(notification.payload.ticketKey);
      const projectId = ticketKey ? await resolveProjectIdByTicketKey(ticketKey) : null;
      return projectId ? `/projects/${projectId}/tickets/${ticketId}` : null;
    }

    // Carries projectId directly (like TICKET_ASSIGNED, unlike COMMENT_ADDED)
    // plus a commentId - lands straight on the Comments step and scrolls to/
    // highlights that one comment, see TicketCommentsSection's own
    // highlightCommentId handling.
    if (notification.type === 'MENTIONED_IN_COMMENT') {
      const projectId = asString(notification.payload.projectId);
      const commentId = asString(notification.payload.commentId);

      if (!projectId) {
        return null;
      }

      return `/projects/${projectId}/tickets/${ticketId}?step=comments${commentId ? `&commentId=${commentId}` : ''}`;
    }

    return null;
  };

  return {resolveNotificationLink};
};

export default useResolveNotificationLinkHook;
