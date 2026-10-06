import {useEffect, useRef, useState} from 'react';
import type {KeyboardEvent, ReactNode} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import type {MenuLevel} from './types';
import PrismFace from './PrismFace';
import {FACE_COUNT, decorateActive, findActivePath, levelAt, physicalFace} from './tree';
import {useFaceWidth} from './useFaceWidth';

type Props = {
  root: MenuLevel;
  content?: ReactNode;
  footer?: ReactNode;
};

const PrismMenu = ({root, content, footer}: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const viewportRef = useFaceWidth<HTMLDivElement>();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const activePathKey = useRef<string>('');
  const didMount = useRef(false);

  // `active` is derived from the current route here so menu trees only need
  // to declare `link` - not `link` plus a hand-written `active: isActive(...)`
  // for every leaf.
  const activeRoot = decorateActive(root, location.pathname);

  // `history` retains chosen indices even below the current `depth` (back
  // navigation only moves the `depth` pointer, it never truncates), so the
  // level you just left can still be re-derived as the "+1" preview. Content
  // itself is never stored in state - every face is (re)computed from the
  // live `activeRoot` on every render via `levelAt`, so it can never go stale
  // when `active` flags change (e.g. after navigating between sibling links).
  const [history, setHistory] = useState<number[]>(() => findActivePath(activeRoot));
  const [depth, setDepth] = useState<number>(() => history.length);

  useEffect(() => {
    const newPath = findActivePath(activeRoot);
    const key = JSON.stringify(newPath);

    if (key === activePathKey.current) {
      return;
    }
    activePathKey.current = key;

    setHistory(newPath);
    setDepth(newPath.length);
  }, [activeRoot]);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }

    // Non-current faces become `inert`, which forces focus off any button inside
    // them (browser behaviour) straight to <body>. Reclaiming focus here keeps
    // it inside the menu so Escape keeps working after every navigation step.
    if (depth > 0) {
      backButtonRef.current?.focus();
    } else {
      wrapperRef.current?.focus();
    }
  }, [depth]);

  const goDeeper = (index: number) => {
    const currentLevel = levelAt(activeRoot, history, depth);
    const item = currentLevel?.items[index];
    if (!item) {
      return;
    }

    item.onClick?.();

    // Both, not either/or - a folder item's `link` is its own real page
    // (e.g. a board's `link` is BoardPage, a project's is ProjectOverview),
    // not just a placeholder for active-highlighting. Drilling into the
    // subMenu without also navigating there left that main page unreachable
    // from the sidebar entirely.
    if (item.link) {
      navigate(item.link);
    }

    if (item.subMenu) {
      setHistory([...history.slice(0, depth), index]);
      setDepth(depth + 1);
    }
  };

  const goBack = () => {
    if (depth === 0) {
      return;
    }

    setDepth(depth - 1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      goBack();
    }
  };

  const faces = [depth - 1, depth, depth + 1]
    .filter((d) => d >= 0)
    .map((d) => ({
      depth: d,
      physicalIndex: physicalFace(d),
      level: levelAt(activeRoot, history, d),
    }));

  return (
    <div
      ref={wrapperRef}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className="flex h-full flex-col outline-none"
    >
      <div ref={viewportRef} className="relative flex-1 overflow-hidden [perspective:1200px]">
        <div
          className="relative h-full w-full transition-transform duration-500 ease-in-out [transform-style:preserve-3d]"
          style={{
            transform: `translateZ(calc(-1 * var(--face-width, 260px) / 2)) rotateY(${-depth * (360 / FACE_COUNT)}deg)`,
          }}
        >
          {faces.map(({physicalIndex, level, depth: faceDepth}) => (
            <PrismFace
              key={physicalIndex}
              physicalIndex={physicalIndex}
              level={level}
              isCurrent={faceDepth === depth}
              showBack={faceDepth > 0}
              onSelect={goDeeper}
              onBack={goBack}
              backButtonRef={backButtonRef}
            />
          ))}
        </div>
      </div>

      {content && <div className="flex-none">{content}</div>}
      {footer && <div className="flex-none border-t border-border">{footer}</div>}
    </div>
  );
};

export default PrismMenu;
