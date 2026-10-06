import {createContext, useContext} from 'react';
import type {BreadcrumbSegment, MenuLevel} from '@/components/PrismMenu';

export type BreadcrumbContextValue = {
  // The same PrismMenu tree Sidebar renders (see Panel.tsx's useSidebarMenu)
  // - the default breadcrumb is derived from this, not tracked separately.
  menu: MenuLevel;
  override: BreadcrumbSegment[] | null;
  setOverride: (segments: BreadcrumbSegment[] | null) => void;
};

export const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

export const useBreadcrumbContext = (): BreadcrumbContextValue => {
  const context = useContext(BreadcrumbContext);

  if (!context) {
    throw new Error('useBreadcrumb/useSetBreadcrumb must be used within a BreadcrumbProvider');
  }

  return context;
};
