import {useMemo, useState} from 'react';
import type {ReactNode} from 'react';
import {BreadcrumbContext} from './context';
import type {BreadcrumbSegment, MenuLevel} from '@/components/PrismMenu';

type BreadcrumbProviderProps = {
  menu: MenuLevel;
  children: ReactNode;
};

export const BreadcrumbProvider = ({menu, children}: BreadcrumbProviderProps) => {
  const [override, setOverride] = useState<BreadcrumbSegment[] | null>(null);
  const value = useMemo(() => ({menu, override, setOverride}), [menu, override]);

  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>;
};
