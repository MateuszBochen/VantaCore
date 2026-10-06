import {forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState} from 'react';
import type {PointerEvent as ReactPointerEvent, ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {X} from 'lucide-react';
import {cn} from '@/lib/utils';

export type PopupHandle = {
  open: () => void;
  close: () => void;
  toggle: () => void;
};

export type PopupProps = {
  title?: string;
  children: ReactNode;
  className?: string;
  // Merged (via cn/tailwind-merge) over the content wrapper's default `p-4`
  // - pass `'p-0'` when embedding something that already manages its own
  // layout edge-to-edge (e.g. a full page component reused inside the popup).
  bodyClassName?: string;
  initialPosition?: {x: number; y: number};
  initialSize?: {width: number; height: number};
  minWidth?: number;
  minHeight?: number;
  onClose?: () => void;
  // When set, position+size are persisted to localStorage under this key
  // (shared by every Popup instance using it, so e.g. every ticket opened
  // from the same feature remembers the same geometry) and restored on the
  // next open, taking priority over initialPosition/initialSize - those
  // only apply the very first time, before anything's been persisted yet.
  storageKey?: string;
};

const DEFAULT_SIZE = {width: 480, height: 360};
const DEFAULT_MIN_WIDTH = 260;
const DEFAULT_MIN_HEIGHT = 160;
const STORAGE_PREFIX = 'popup:';

// The header is the only drag handle this window has - past this margin, a
// drag (or a persisted position from a since-shrunk window) can push it
// fully off-screen with no way to grab it again. Position is also persisted
// to localStorage under storageKey, so an off-screen popup used to stay
// stuck that way across reloads too - clampPosition runs on the restored
// value as well, so an already-broken saved position self-heals next open.
const MIN_VISIBLE_MARGIN = 48;

const clampPosition = (pos: {x: number; y: number}, width: number): {x: number; y: number} => ({
  x: Math.min(Math.max(pos.x, -(width - MIN_VISIBLE_MARGIN)), window.innerWidth - MIN_VISIBLE_MARGIN),
  y: Math.min(Math.max(pos.y, 0), window.innerHeight - MIN_VISIBLE_MARGIN),
});

// A fast pointer sweeping over the popup's own content during a drag/resize
// otherwise selects whatever text it crosses (the browser doesn't know this
// mouse-down was "move the window", not "start selecting") - looks broken
// mid-drag even though nothing was actually clicked to select. Suppressed
// on the whole body (not just the popup) since the pointer can leave the
// popup's bounds while still dragging/resizing.
const suppressBodyUserSelect = (): void => {
  document.body.style.userSelect = 'none';
};

const restoreBodyUserSelect = (): void => {
  document.body.style.userSelect = '';
};

type PersistedGeometry = {x: number; y: number; width: number; height: number};

const readPersistedGeometry = (storageKey: string): PersistedGeometry | null => {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${storageKey}`);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<PersistedGeometry>;

    if (
      typeof parsed.x === 'number' &&
      typeof parsed.y === 'number' &&
      typeof parsed.width === 'number' &&
      typeof parsed.height === 'number'
    ) {
      return parsed as PersistedGeometry;
    }
  } catch {
    // Corrupt/foreign value under this key - fall back to defaults below.
  }

  return null;
};

const writePersistedGeometry = (storageKey: string, geometry: PersistedGeometry): void => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${storageKey}`, JSON.stringify(geometry));
  } catch {
    // localStorage unavailable (private mode, quota) - not worth surfacing.
  }
};

// A floating, draggable, resizable window - not a modal (no backdrop, no
// click-outside-to-close: "moveable" implies the user may want to keep it
// open while interacting with the rest of the page, like a real window).
// Open/closed state is imperative (ref.current.open()/close()/toggle()),
// not a controlled `open` prop - mount this once and drive it via ref.
// Rendered through a portal so it's never clipped by an ancestor's
// overflow/positioning.
const Popup = forwardRef<PopupHandle, PopupProps>(
  (
    {
      title,
      children,
      className,
      bodyClassName,
      initialPosition,
      initialSize,
      minWidth = DEFAULT_MIN_WIDTH,
      minHeight = DEFAULT_MIN_HEIGHT,
      onClose,
      storageKey,
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const persisted = storageKey ? readPersistedGeometry(storageKey) : null;
    const [size, setSize] = useState(() => (persisted ? {width: persisted.width, height: persisted.height} : (initialSize ?? DEFAULT_SIZE)));
    const [position, setPosition] = useState(() =>
      clampPosition(persisted ? {x: persisted.x, y: persisted.y} : (initialPosition ?? {x: 160, y: 120}), persisted?.width ?? initialSize?.width ?? DEFAULT_SIZE.width),
    );
    const positionRef = useRef(position);
    const sizeRef = useRef(size);
    positionRef.current = position;
    sizeRef.current = size;

    const handleClose = useCallback(() => {
      setIsOpen(false);
      onClose?.();
    }, [onClose]);

    useImperativeHandle(
      ref,
      () => ({
        open: () => setIsOpen(true),
        close: handleClose,
        toggle: () => setIsOpen((current) => !current),
      }),
      [handleClose],
    );

    useEffect(() => {
      if (!isOpen) {
        return;
      }

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          handleClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleClose]);

    useEffect(() => {
      if (!storageKey) {
        return;
      }

      writePersistedGeometry(storageKey, {x: position.x, y: position.y, width: size.width, height: size.height});
    }, [storageKey, position, size]);

    // A position that was fine when set can become unreachable purely from
    // the browser window shrinking afterward (no drag involved) - re-clamp
    // whenever that happens too, not just during an active drag.
    useEffect(() => {
      if (!isOpen) {
        return;
      }

      const handleWindowResize = () => {
        setPosition((current) => clampPosition(current, sizeRef.current.width));
      };

      window.addEventListener('resize', handleWindowResize);
      return () => window.removeEventListener('resize', handleWindowResize);
    }, [isOpen]);

    const handleDragPointerDown = (event: ReactPointerEvent) => {
      if (event.button !== 0) {
        return;
      }

      const offsetX = event.clientX - positionRef.current.x;
      const offsetY = event.clientY - positionRef.current.y;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        setPosition(clampPosition({x: moveEvent.clientX - offsetX, y: moveEvent.clientY - offsetY}, sizeRef.current.width));
      };

      const handlePointerUp = () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        restoreBodyUserSelect();
      };

      suppressBodyUserSelect();
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    };

    const handleResizePointerDown = (event: ReactPointerEvent) => {
      if (event.button !== 0) {
        return;
      }

      event.stopPropagation();

      const startX = event.clientX;
      const startY = event.clientY;
      const startWidth = sizeRef.current.width;
      const startHeight = sizeRef.current.height;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        setSize({
          width: Math.max(minWidth, startWidth + (moveEvent.clientX - startX)),
          height: Math.max(minHeight, startHeight + (moveEvent.clientY - startY)),
        });
      };

      const handlePointerUp = () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        restoreBodyUserSelect();
      };

      suppressBodyUserSelect();
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    };

    if (!isOpen) {
      return null;
    }

    return createPortal(
      <div
        role="dialog"
        aria-modal="false"
        style={{left: position.x, top: position.y, width: size.width, height: size.height}}
        className={cn(
          'fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl shadow-black/50 backdrop-blur-sm',
          className,
        )}
      >
        <div
          onPointerDown={handleDragPointerDown}
          className="flex shrink-0 cursor-grab items-center justify-between gap-2 border-b border-border bg-card px-3 py-2 select-none active:cursor-grabbing"
        >
          <p className="truncate text-sm font-medium text-foreground">{title}</p>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className={cn('min-h-0 flex-1 overflow-auto p-4', bodyClassName)}>{children}</div>

        <div onPointerDown={handleResizePointerDown} className="absolute right-0 bottom-0 h-4 w-4 cursor-nwse-resize">
          <svg viewBox="0 0 16 16" className="h-full w-full text-foreground/20">
            <path d="M14 2 L2 14 M14 8 L8 14" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
      </div>,
      document.body,
    );
  },
);

Popup.displayName = 'Popup';

export {Popup};
