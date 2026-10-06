import {useCallback, useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Bell, LogOut, Moon, Settings, ShieldCheck, Sun, UserRound, Users, Zap} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Avatar} from '@/components/ui/avatar';
import {cn} from '@/lib/utils';
import JwtManager from '@/lib/Jwt/JwtManager';
import {eventBus} from '@/lib/EventBus/EventBus';
import {UserLoggedOutEvent} from '@/lib/Auth/Event/UserLoggedOutEvent';
import {NotificationWasCreatedRemoteEvent} from '@/lib/WebSocket/Event/NotificationWasCreatedRemoteEvent';
import useListNotificationsHook from '@/lib/Notification/useListNotificationsHook';
import useMarkNotificationReadHook from '@/lib/Notification/useMarkNotificationReadHook';
import useResolveNotificationLinkHook from '@/lib/Notification/useResolveNotificationLinkHook';
import useUsersHook from '@/lib/User/useUsersHook';
import getUserDisplayName from '@/lib/User/getUserDisplayName';
import useAppTheme from '@/lib/Theme/useAppTheme';
import type {NotificationSummary} from '@/lib/Notification/Type/types';
import type {UserSummary} from '@/lib/User/Type/types';
import type {AppTheme} from '@/lib/Theme/Type/types';

const THEME_OPTIONS: {id: AppTheme; label: string; Icon: typeof Sun}[] = [
  {id: 'light', label: 'Jasny', Icon: Sun},
  {id: 'dark', label: 'Ciemny', Icon: Moon},
  {id: 'neon-blaster', label: 'Neon Blaster', Icon: Zap},
];

// A NOTIFICATION_CREATED websocket event (see the subscription below) is
// now the primary way new notifications show up live - this poll is just
// the fallback for whatever a reconnect gap misses (see WebSocketService's
// own reconnect-with-backoff), not the main mechanism anymore.
const POLL_INTERVAL_MS = 60_000;

// Most payload shapes aren't confirmed per-type yet (backend still
// finalizing them) - fall back to a humanized version of `type` rather than
// guessing per-type text for those. MENTIONED_IN_COMMENT's payload is
// confirmed (2026-08-20: mentionedByUserId/ticketKey/commentId/body), so it
// gets a real label instead of "Mentioned In Comment".
const describeNotification = (notification: NotificationSummary, users: UserSummary[]): string => {
  if (notification.type === 'MENTIONED_IN_COMMENT') {
    const mentionedBy = users.find((user) => user.id === notification.payload.mentionedByUserId);
    const ticketKey = typeof notification.payload.ticketKey === 'string' ? notification.payload.ticketKey : 'a ticket';
    return `${mentionedBy ? getUserDisplayName(mentionedBy) : 'Someone'} mentioned you in a comment on ${ticketKey}`;
  }

  return notification.type.replace(/[._-]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

const UserBadge = () => {
  const email = JwtManager.getInstance().getEmail();
  const navigate = useNavigate();
  // There's no GET /api/user/me - "which directory entry is mine" is found
  // by matching the JWT's email against the (session-cached) user
  // directory, same approach as ProfilePage.
  const {users} = useUsersHook();
  const me = users.find((user) => user.email === email) ?? null;
  const {theme, setTheme} = useAppTheme();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationSummary[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const {listNotifications} = useListNotificationsHook();
  const {markNotificationRead} = useMarkNotificationReadHook();
  const {resolveNotificationLink} = useResolveNotificationLinkHook();

  const unreadCount = notifications?.filter((notification) => !notification.read).length ?? 0;

  const refreshNotifications = useCallback(() => {
    listNotifications().then((result) => {
      if (result.success) {
        setNotifications(result.notifications);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listNotifications is a thin useRequestHook wrapper recreated every render
  }, []);

  useEffect(() => {
    refreshNotifications();

    const timer = setInterval(refreshNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refreshNotifications]);

  // Live-prepends a just-created notification instead of waiting for the
  // next poll - deduped by id in case the poll already picked it up first
  // (both racing is harmless either way).
  useEffect(() => {
    const handleNotificationCreated = (remoteEvent: NotificationWasCreatedRemoteEvent) => {
      const payload = remoteEvent.payload;

      if (typeof payload !== 'object' || payload === null || typeof (payload as {id?: unknown}).id !== 'string') {
        return;
      }

      const notification = payload as NotificationSummary;

      setNotifications((current) => [notification, ...(current ?? []).filter((existing) => existing.id !== notification.id)]);
    };

    eventBus.subscribe<NotificationWasCreatedRemoteEvent>(NotificationWasCreatedRemoteEvent.name, handleNotificationCreated);

    return () => {
      eventBus.unsubscribe<NotificationWasCreatedRemoteEvent>(NotificationWasCreatedRemoteEvent.name, handleNotificationCreated);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!notifOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!notifRef.current?.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNotifOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [notifOpen]);

  const handleToggleNotifications = () => {
    // Opening the list on its own doesn't mark anything read server-side -
    // just refreshes what's shown. Only clicking an individual notification does.
    setNotifOpen((current) => {
      if (!current) {
        refreshNotifications();
      }

      return !current;
    });
  };

  const handleNotificationClick = (notification: NotificationSummary) => {
    if (!notification.read) {
      setNotifications((current) =>
        (current ?? []).map((candidate) => (candidate.id === notification.id ? {...candidate, read: true} : candidate)),
      );

      void markNotificationRead(notification.id);
    }

    // Navigation is best-effort - an unrecognized notification type, or a
    // payload missing what it needs (see useResolveNotificationLinkHook),
    // just resolves to null and leaves the panel open with nothing but the
    // read-state change above.
    resolveNotificationLink(notification).then((to) => {
      if (to) {
        setNotifOpen(false);
        navigate(to);
      }
    });
  };

  const handleNavigate = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  const handleOpenNotificationPreferences = () => {
    setNotifOpen(false);
    navigate('/profile?step=notifications');
  };

  const handleLogout = () => {
    setOpen(false);
    JwtManager.getInstance().removeJwt();
    eventBus.dispatch(new UserLoggedOutEvent());
  };

  return (
    <div className="flex items-center gap-2">
      <div ref={notifRef} className="relative">
        <Button
          variant="ghost"
          size="icon"
          disableRipple
          onClick={handleToggleNotifications}
          className="relative h-10 w-10 min-w-0 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        {notifOpen && (
          <div className="absolute right-0 top-full z-20 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-popover shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              <button
                type="button"
                onClick={handleOpenNotificationPreferences}
                title="Notification preferences"
                className="text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications === null ? (
                <p className="px-3.5 py-4 text-sm text-muted-foreground">Loading…</p>
              ) : notifications.length === 0 ? (
                <p className="px-3.5 py-4 text-sm text-muted-foreground">No notifications.</p>
              ) : (
                notifications.map((notification) => (
                  <Button
                    key={notification.id}
                    variant="ghost"
                    disableRipple
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'h-auto w-full min-w-0 flex-col items-start gap-0.5 rounded-none border-b border-border px-3.5 py-2.5 text-left last:border-0 hover:bg-muted',
                      !notification.read && 'bg-accent/5',
                    )}
                  >
                    <span className="flex w-full items-center gap-2">
                      {!notification.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
                      <span className="min-w-0 flex-1 truncate text-sm font-normal text-foreground">
                        {describeNotification(notification, users)}
                      </span>
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </Button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-muted"
        >
          <div className="min-w-0 text-right">
            <p className="truncate text-sm font-medium text-foreground">{email || 'Unknown user'}</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
          <Avatar
            name={me ? getUserDisplayName(me) : email}
            src={me?.avatarUrl}
            className="h-10 w-10 shrink-0 bg-gradient-to-br from-(--accent-gradient-from) to-(--accent-gradient-to) text-sm font-semibold text-black"
          />
        </button>

        {open && (
          <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-popover py-1.5 shadow-xl backdrop-blur-xl">
            {/* Doesn't close the dropdown on click (unlike handleNavigate
                below) - switching back and forth between themes to compare
                is meant to be a single click each way. */}
            <div className="flex items-center justify-center gap-2 border-b border-border px-3.5 py-2.5">
              {THEME_OPTIONS.map(({id, label, Icon}) => (
                <button
                  key={id}
                  type="button"
                  title={label}
                  onClick={() => setTheme(id)}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                    theme === id ? 'bg-accent/20 text-accent' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleNavigate('/profile')}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted hover:text-accent"
            >
              <UserRound className="h-4 w-4" />
              My profile
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('/users')}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted hover:text-accent"
            >
              <Users className="h-4 w-4" />
              Users
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('/roles')}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted hover:text-accent"
            >
              <ShieldCheck className="h-4 w-4" />
              Roles
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('/settings')}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted hover:text-accent"
            >
              <Settings className="h-4 w-4" />
              Application settings
            </button>

            <div className="my-1 border-t border-border" />

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserBadge;
