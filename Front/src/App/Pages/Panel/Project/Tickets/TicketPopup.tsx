import {forwardRef, useImperativeHandle, useRef, useState} from 'react';
import {Popup, type PopupHandle} from '@/components/ui/popup';
import useGetProjectHook from '@/lib/Project/useGetProjectHook';
import TicketEditor from './TicketEditor';
import type {Project} from '@/lib/Project/Type/types';
import type {Ticket} from '@/lib/Ticket/Type/types';

export type TicketPopupHandle = {
  open: (projectId: string, ticketId: string, ticketKey: string) => void;
  // Starts a fresh child draft under `parentId`, in the same popup - once it
  // saves, the popup seamlessly switches into viewing/editing the real
  // created ticket (see handleCreated) rather than closing, so "add a
  // ticket" never has to leave wherever the popup was opened from.
  openNew: (projectId: string, parentId: string) => void;
  close: () => void;
};

type TicketPopupProps = {
  // Distinguishes one caller's remembered geometry (see Popup's storageKey)
  // from another's - every ticket opened from the SAME feature shares one
  // remembered size/position, but two DIFFERENT TicketPopup instances that
  // can be open at once (e.g. a ticket popup's own "Children" step opening a
  // second popup on top of it) need their own key, or they'd both default to
  // the exact same spot on screen.
  storageKey?: string;
};

const DEFAULT_STORAGE_KEY = 'sprint-ticket-popup';

// Opens a ticket in the same edit view as the real
// /projects/:projectId/tickets/:ticketId route, just inside a floating
// Popup instead of navigating the whole page away. Uses TicketEditor
// directly (the router-independent component TicketPage itself is now just
// a thin wrapper around) - no MemoryRouter, no separate React root. An
// earlier attempt tried reusing TicketPage as-is by sandboxing it inside a
// nested MemoryRouter, which React Router rejects outright ("cannot render
// a Router inside another Router" - createPortal moves DOM placement, not
// React context, so the nesting still counted); a fully separate React root
// dodged that but then broke on useSetModuleTitle needing a
// ModuleTitleProvider that a detached tree doesn't have either. Splitting
// the router dependency out of the component itself (see TicketEditor,
// TicketPage) is what actually fixed it - this component just needed to
// supply its own equivalents of the few things TicketEditor used to get
// from routing (project, ticketId, step state, onBack).
const TicketPopup = forwardRef<TicketPopupHandle, TicketPopupProps>(({storageKey = DEFAULT_STORAGE_KEY}, ref) => {
  const popupRef = useRef<PopupHandle>(null);
  const {getProject} = useGetProjectHook();
  const [project, setProject] = useState<Project | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [ticketKey, setTicketKey] = useState<string>('Ticket');
  const [step, setStep] = useState('ticket');
  const [isNewTicket, setIsNewTicket] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      open: (projectId: string, openTicketId: string, openTicketKey: string) => {
        setProject(null);
        setIsNewTicket(false);
        setParentId(null);
        setTicketId(openTicketId);
        setTicketKey(openTicketKey);
        setStep('ticket');

        getProject(projectId).then((result) => {
          if (result.success) {
            setProject(result.project);
          }
        });

        popupRef.current?.open();
      },
      openNew: (projectId: string, forParentId: string) => {
        setProject(null);
        setIsNewTicket(true);
        setParentId(forParentId);
        setTicketId(null);
        setTicketKey('New ticket');
        setStep('ticket');

        getProject(projectId).then((result) => {
          if (result.success) {
            setProject(result.project);
          }
        });

        popupRef.current?.open();
      },
      close: () => popupRef.current?.close(),
    }),
    [getProject],
  );

  const handleCreated = (ticket: Ticket) => {
    setIsNewTicket(false);
    setParentId(null);
    setTicketId(ticket.id);
    setTicketKey(ticket.key);
  };

  return (
    <Popup
      ref={popupRef}
      title={ticketKey}
      bodyClassName="p-0"
      storageKey={storageKey}
      initialSize={{width: window.innerWidth * 0.7, height: window.innerHeight * 0.8}}
      initialPosition={{x: window.innerWidth * 0.15, y: window.innerHeight * 0.1}}
    >
      {project && (isNewTicket || ticketId) ? (
        <TicketEditor
          project={project}
          ticketId={isNewTicket ? undefined : (ticketId ?? undefined)}
          isNew={isNewTicket}
          parentId={parentId}
          step={step}
          onStepChange={setStep}
          onCreated={handleCreated}
          onBack={() => popupRef.current?.close()}
        />
      ) : (
        <p className="p-8 text-sm text-muted-foreground">Loading ticket…</p>
      )}
    </Popup>
  );
});

TicketPopup.displayName = 'TicketPopup';

export default TicketPopup;
