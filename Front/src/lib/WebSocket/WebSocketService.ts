import JwtManager from '../Jwt/JwtManager';
import {Settings} from '../Settings/Settings';
import {SettingName} from '../Settings/Enum/SettingName';
import {eventBus} from '../EventBus/EventBus';
import {UserLoggedInEvent} from '../Auth/Event/UserLoggedInEvent';
import {UserLoggedOutEvent} from '../Auth/Event/UserLoggedOutEvent';
import {TicketWasCreatedRemoteEvent} from './Event/TicketWasCreatedRemoteEvent';
import {TicketWasChangedRemoteEvent} from './Event/TicketWasChangedRemoteEvent';
import {TicketWasDeletedRemoteEvent} from './Event/TicketWasDeletedRemoteEvent';
import {WorklogWasStartedRemoteEvent} from './Event/WorklogWasStartedRemoteEvent';
import {WorklogWasChangedRemoteEvent} from './Event/WorklogWasChangedRemoteEvent';
import {CommentWasAddedRemoteEvent} from './Event/CommentWasAddedRemoteEvent';
import {CommentWasChangedRemoteEvent} from './Event/CommentWasChangedRemoteEvent';
import {CommentWasDeletedRemoteEvent} from './Event/CommentWasDeletedRemoteEvent';
import {NotificationWasCreatedRemoteEvent} from './Event/NotificationWasCreatedRemoteEvent';
import {WebSocketMessageReceivedEvent} from './Event/WebSocketMessageReceivedEvent';

const INITIAL_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

// Envelope confirmed 2026-08-04 from real test messages: {"type": "...",
// "payload": {...}}. Every key below is confirmed straight from the
// backend's own *WebSocketHandler.java broadcastAll()/notifyUser() calls -
// unrecognized types are still console.warn'd (not silently dropped) so a
// future mismatch shows up in devtools instead of just quietly never firing.
const TICKET_CREATED_KEY = 'TICKET_CREATED';
const TICKET_CHANGED_KEY = 'TICKET_CHANGED';
const TICKET_DELETED_KEY = 'TICKET_DELETED';
const WORKLOG_STARTED_KEY = 'WORKLOG_STARTED';
const WORKLOG_CHANGED_KEY = 'WORKLOG_CHANGED';
const COMMENT_ADDED_KEY = 'COMMENT_ADDED';
const COMMENT_CHANGED_KEY = 'COMMENT_CHANGED';
const COMMENT_DELETED_KEY = 'COMMENT_DELETED';
const NOTIFICATION_CREATED_KEY = 'NOTIFICATION_CREATED';

type IncomingMessage = {
    type?: unknown;
    payload?: unknown;
};

// Opens one websocket connection for the whole app, alongside the existing
// login lifecycle (UserLoggedInEvent/UserLoggedOutEvent) - same singleton
// pattern as JwtManager/JwtRefreshScheduler/EventBus. Started once from
// main.tsx (see jwtRefreshScheduler.start() there for the same convention).
class WebSocketService {
    private static instance: WebSocketService;

    private socket: WebSocket | null = null;

    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    private reconnectDelay = INITIAL_RECONNECT_DELAY_MS;

    // Set right before a deliberate close (logout) so `onclose` can tell that
    // apart from a dropped connection and skip reconnecting.
    private intentionalClose = false;

    static getInstance = (): WebSocketService => {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }

        return WebSocketService.instance;
    }

    private constructor() {
    }

    start = (): void => {
        eventBus.subscribe<UserLoggedInEvent>(UserLoggedInEvent.name, this.connect);
        eventBus.subscribe<UserLoggedOutEvent>(UserLoggedOutEvent.name, this.disconnect);

        // Covers the page-reload-while-already-logged-in case - login just
        // dispatches UserLoggedInEvent at the moment it happens, so a fresh
        // page load with an already-valid JWT would never otherwise connect.
        if (JwtManager.getInstance().jwtIsValid()) {
            this.connect();
        }
    }

    connect = (): void => {
        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            return;
        }

        const jwt = JwtManager.getInstance().getJwt();

        if (!jwt) {
            return;
        }

        this.intentionalClose = false;

        const apiHost = Settings.getSetting(SettingName.API_HOST);
        const wsHost = apiHost.replace(/^http/, 'ws');
        const socket = new WebSocket(`${wsHost}/ws-api?token=${encodeURIComponent(jwt)}`);

        socket.onopen = () => {
            this.reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
        };

        socket.onmessage = this.handleMessage;

        socket.onclose = () => {
            this.socket = null;

            if (!this.intentionalClose) {
                this.scheduleReconnect();
            }
        };

        // The close event that follows is what actually triggers a
        // reconnect attempt (see onclose) - this just avoids an unhandled
        // "WebSocket error" console entry on top of it.
        socket.onerror = () => {
            socket.close();
        };

        this.socket = socket;
    }

    disconnect = (): void => {
        this.intentionalClose = true;

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        this.socket?.close();
        this.socket = null;
    }

    private scheduleReconnect = (): void => {
        if (this.reconnectTimer) {
            return;
        }

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, this.reconnectDelay);

        this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
    }

    private handleMessage = (event: MessageEvent): void => {
        let message: IncomingMessage;

        try {
            message = JSON.parse(event.data);
        } catch {
            console.warn('[WebSocketService] Received a non-JSON message', event.data);
            return;
        }

        const type = message.type;

        if (typeof type !== 'string') {
            console.warn('[WebSocketService] Received a message with no string "type" to route on', message);
            return;
        }

        // Fired for every message regardless of whether `type` below is one
        // we actually route - even an unrecognized message is still real WS
        // input activity worth showing.
        eventBus.dispatch(new WebSocketMessageReceivedEvent());

        switch (type) {
            case TICKET_CREATED_KEY:
                eventBus.dispatch(new TicketWasCreatedRemoteEvent(message.payload ?? message));
                break;
            case TICKET_CHANGED_KEY:
                eventBus.dispatch(new TicketWasChangedRemoteEvent(message.payload ?? message));
                break;
            case TICKET_DELETED_KEY:
                eventBus.dispatch(new TicketWasDeletedRemoteEvent(message.payload ?? message));
                break;
            case WORKLOG_STARTED_KEY:
                eventBus.dispatch(new WorklogWasStartedRemoteEvent(message.payload ?? message));
                break;
            case WORKLOG_CHANGED_KEY:
                eventBus.dispatch(new WorklogWasChangedRemoteEvent(message.payload ?? message));
                break;
            case COMMENT_ADDED_KEY:
                eventBus.dispatch(new CommentWasAddedRemoteEvent(message.payload ?? message));
                break;
            case COMMENT_CHANGED_KEY:
                eventBus.dispatch(new CommentWasChangedRemoteEvent(message.payload ?? message));
                break;
            case COMMENT_DELETED_KEY:
                eventBus.dispatch(new CommentWasDeletedRemoteEvent(message.payload ?? message));
                break;
            case NOTIFICATION_CREATED_KEY:
                eventBus.dispatch(new NotificationWasCreatedRemoteEvent(message.payload ?? message));
                break;
            default:
                console.warn(`[WebSocketService] Unrecognized message type "${type}" - add a mapping in WebSocketService.ts`, message);
        }
    }
}

export default WebSocketService;

export const webSocketService = WebSocketService.getInstance();
