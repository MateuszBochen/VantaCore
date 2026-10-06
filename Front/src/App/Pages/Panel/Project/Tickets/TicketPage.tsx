import {useNavigate, useParams, useSearchParams} from 'react-router-dom';
import useProjectFromRoute from '../useProjectFromRoute';
import TicketEditor from './TicketEditor';
import {getTicketsListPath} from '@/lib/Ticket/ticketsListSearch';

type TicketPageProps = {
  // .../tickets/new: no ticket exists yet, so it starts as a local draft and
  // nothing is sent to the API until Submit - same pattern as ProjectSettings
  // and SubProjectDocumentationPage.
  isNew?: boolean;
};

// Thin route wrapper around TicketEditor (the actual view/logic, which is
// deliberately router-independent - see its own comment) - this is just
// where router-derived values (params/search params/navigate) get resolved
// into plain props, and where the three places TicketEditor used to
// navigate() directly become explicit callbacks. TicketPopup is the other
// caller of TicketEditor, supplying its own equivalents for a floating
// window that has no route of its own at all.
const TicketPage = ({isNew = false}: TicketPageProps) => {
  const {ticketId} = useParams<{ticketId: string}>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const {project, state: projectState} = useProjectFromRoute();

  const parentId = searchParams.get('parentId');
  const step = searchParams.get('step') ?? 'ticket';
  // Set by a MENTIONED_IN_COMMENT notification's link (see
  // useResolveNotificationLinkHook) - scrolls to and highlights that one
  // comment once the Comments step loads, see TicketCommentsSection.
  const highlightCommentId = searchParams.get('commentId');

  const handleStepChange = (id: string) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set('step', id);
        return next;
      },
      {replace: true},
    );
  };

  if (projectState === 'loading' || !project) {
    return <div className="p-8 text-sm text-muted-foreground">Loading project…</div>;
  }

  if (projectState === 'error') {
    return <div className="p-8 text-sm text-muted-foreground">Couldn't load this project.</div>;
  }

  return (
    <TicketEditor
      project={project}
      ticketId={isNew ? undefined : ticketId}
      isNew={isNew}
      parentId={parentId}
      step={step}
      onStepChange={handleStepChange}
      highlightCommentId={highlightCommentId}
      // Preserves the current query string (step/commentId/parentId, ...) -
      // without this, a link straight to a raw ticket uuid (e.g. a
      // MENTIONED_IN_COMMENT notification's ?step=comments&commentId=...)
      // lost it the instant this uuid->key redirect fired, landing back on
      // the default Ticket step instead of Comments.
      onKeyResolved={(key) => {
        const query = searchParams.toString();
        navigate(`/projects/${project.id}/tickets/${key}${query ? `?${query}` : ''}`, {replace: true});
      }}
      onCreated={(ticket) => navigate(`/projects/${project.id}/tickets/${ticket.id}`, {replace: true})}
      // Back to the Tickets page's last search, not a blank list.
      onBack={() => navigate(getTicketsListPath(project.id))}
    />
  );
};

export default TicketPage;
