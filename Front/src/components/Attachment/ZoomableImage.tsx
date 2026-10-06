import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import type {PointerEvent as ReactPointerEvent} from 'react';
import {Minus, Plus} from 'lucide-react';
import {Button} from '@/components/ui/button';

type ZoomableImageProps = {
  src: string;
  alt: string;
  // A click on the empty area around the image (not a drag) - the lightbox
  // closes on it, same as clicking its backdrop.
  onBackdropClick: () => void;
};

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 8;
const ZOOM_STEP = 1.25;
// Pointer travel (px) past which a press counts as a pan, not a click.
const DRAG_THRESHOLD = 4;

const clampZoom = (zoom: number): number => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

// The image view of both AttachmentPreviewLightbox and the MarkdownEditor's
// openImageLightbox. Zoom is relative to the image's
// natural size (100% = one image pixel per CSS pixel), starting at "fit"
// (the largest zoom that shows the whole image, capped at 100% so small
// images aren't blown up). The image is laid out at its zoomed size inside a
// scrollable area rather than CSS-transformed, so a zoomed image scrolls
// natively; dragging pans it. Zoom: the -/+ buttons, the mouse wheel, or the
// +/-/0 keys; clicking the percentage (or 0) goes back to fit.
const ZoomableImage = ({src, alt, onBackdropClick}: ZoomableImageProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [naturalSize, setNaturalSize] = useState<{width: number; height: number} | null>(null);
  const [zoom, setZoom] = useState(1);
  // Scroll position as a fraction of the content, captured just before a
  // zoom change and re-applied after layout - keeps the same spot centred
  // instead of jumping to the top-left corner.
  const pendingCenterRef = useRef<{x: number; y: number} | null>(null);
  const dragRef = useRef<{x: number; y: number; scrollLeft: number; scrollTop: number; moved: boolean; onImage: boolean} | null>(null);

  const fitZoomFor = (size: {width: number; height: number} | null): number => {
    const container = scrollRef.current;

    if (!container || !size) {
      return 1;
    }

    return clampZoom(Math.min(1, container.clientWidth / size.width, container.clientHeight / size.height));
  };

  const applyZoom = useCallback((next: (current: number) => number) => {
    const container = scrollRef.current;

    if (container) {
      pendingCenterRef.current = {
        x: (container.scrollLeft + container.clientWidth / 2) / Math.max(container.scrollWidth, 1),
        y: (container.scrollTop + container.clientHeight / 2) / Math.max(container.scrollHeight, 1),
      };
    }

    setZoom((current) => clampZoom(next(current)));
  }, []);

  const zoomIn = useCallback(() => applyZoom((current) => current * ZOOM_STEP), [applyZoom]);
  const zoomOut = useCallback(() => applyZoom((current) => current / ZOOM_STEP), [applyZoom]);
  const resetToFit = useCallback(() => applyZoom(() => fitZoomFor(naturalSize)), [applyZoom, naturalSize]);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    const center = pendingCenterRef.current;

    if (!container || !center) {
      return;
    }

    pendingCenterRef.current = null;
    container.scrollLeft = center.x * container.scrollWidth - container.clientWidth / 2;
    container.scrollTop = center.y * container.scrollHeight - container.clientHeight / 2;
  }, [zoom]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      if (event.key === '+' || event.key === '=') {
        zoomIn();
      } else if (event.key === '-' || event.key === '_') {
        zoomOut();
      } else if (event.key === '0') {
        resetToFit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, resetToFit]);

  // Native listener, not React's onWheel - React registers wheel as passive,
  // so it couldn't preventDefault the page/area scroll the wheel would
  // otherwise also do.
  useEffect(() => {
    const container = scrollRef.current;

    if (!container) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      if (event.deltaY < 0) {
        zoomIn();
      } else if (event.deltaY > 0) {
        zoomOut();
      }
    };

    container.addEventListener('wheel', handleWheel, {passive: false});

    return () => container.removeEventListener('wheel', handleWheel);
  }, [zoomIn, zoomOut]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const container = scrollRef.current;

    if (!container || event.button !== 0) {
      return;
    }

    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
      moved: false,
      // Read here, not on pointerup - pointer capture retargets pointerup
      // to the container itself.
      onImage: event.target instanceof HTMLImageElement,
    };
    container.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const container = scrollRef.current;

    if (!drag || !container) {
      return;
    }

    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;

    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) {
      return;
    }

    drag.moved = true;
    container.scrollLeft = drag.scrollLeft - dx;
    container.scrollTop = drag.scrollTop - dy;
  };

  const handlePointerUp = () => {
    const drag = dragRef.current;
    dragRef.current = null;

    // A plain click outside the image (not a pan) closes, like the backdrop.
    if (drag && !drag.moved && !drag.onImage) {
      onBackdropClick();
    }
  };

  const zoomedWidth = naturalSize ? naturalSize.width * zoom : undefined;
  const zoomedHeight = naturalSize ? naturalSize.height * zoom : undefined;

  return (
    <div className="relative h-full w-full">
      <div
        ref={scrollRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          dragRef.current = null;
        }}
        className="flex h-full w-full cursor-grab overflow-auto active:cursor-grabbing"
      >
        {/* m-auto (not justify/items-center on the parent) - centres the
            image while it's smaller than the area, but still lets it scroll
            from its real top-left edge once it's bigger. */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          onLoad={(event) => {
            // Every load (a new src too) starts over from fit.
            const size = {width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight};
            setNaturalSize(size);
            setZoom(fitZoomFor(size));
          }}
          style={{width: zoomedWidth, height: zoomedHeight}}
          className={`m-auto max-w-none shrink-0 select-none rounded-lg shadow-2xl ${naturalSize ? '' : 'invisible'}`}
        />
      </div>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-white/10 bg-zinc-900/90 p-1 shadow-lg">
        <Button
          variant="ghost"
          size="icon"
          disableRipple
          leftIcon={<Minus className="h-4 w-4" />}
          onClick={zoomOut}
          disabled={zoom <= MIN_ZOOM}
          title="Zoom out (-)"
          className="h-8 w-8 min-w-0 rounded-md text-zinc-300 hover:bg-white/10 hover:text-white"
        />
        <button
          type="button"
          onClick={resetToFit}
          title="Fit to screen (0)"
          className="w-14 cursor-pointer rounded-md py-1 text-center text-xs tabular-nums text-zinc-200 hover:bg-white/10"
        >
          {Math.round(zoom * 100)}%
        </button>
        <Button
          variant="ghost"
          size="icon"
          disableRipple
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={zoomIn}
          disabled={zoom >= MAX_ZOOM}
          title="Zoom in (+)"
          className="h-8 w-8 min-w-0 rounded-md text-zinc-300 hover:bg-white/10 hover:text-white"
        />
      </div>
    </div>
  );
};

export default ZoomableImage;
