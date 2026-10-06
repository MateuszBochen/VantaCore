import {useCallback, useEffect, useRef, useState} from 'react';
import PrismMenu from '../../../components/PrismMenu';
import SidebarLogo from './SidebarLogo';
import type {MenuLevel} from '../../../components/PrismMenu';

const MIN_WIDTH = 200;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 264;
const STORAGE_KEY = 'panelSidebarWidth';

const readStoredWidth = (): number => {
  const stored = Number(localStorage.getItem(STORAGE_KEY));
  return stored >= MIN_WIDTH && stored <= MAX_WIDTH ? stored : DEFAULT_WIDTH;
};

type SidebarProps = {
  // Built once in Panel.tsx (see useSidebarMenu) and shared with
  // WorkPlaceHeader's breadcrumb - Sidebar itself no longer owns any of the
  // projects/boards/active-* state that goes into it.
  menu: MenuLevel;
};

const Sidebar = ({menu}: SidebarProps) => {
  const [width, setWidth] = useState<number>(readStoredWidth);
  const isResizing = useRef(false);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (!isResizing.current) {
      return;
    }

    setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, event.clientX)));
  }, []);

  const stopResizing = useCallback(() => {
    if (!isResizing.current) {
      return;
    }

    isResizing.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    setWidth((current) => {
      localStorage.setItem(STORAGE_KEY, String(current));
      return current;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopResizing);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopResizing);
    };
  }, [handlePointerMove, stopResizing]);

  const startResizing = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  return (
    <aside
      style={{width}}
      className="relative flex h-full flex-shrink-0 flex-col border-r border-border bg-card backdrop-blur-xl"
    >
      <SidebarLogo />

      <div className="min-h-0 flex-1">
        <PrismMenu root={menu} />
      </div>

      <div
        onPointerDown={startResizing}
        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-accent/40"
      />
    </aside>
  );
};

export default Sidebar;
