import {useMemo, useState} from 'react';
import type {ReactNode} from 'react';
import {ModuleTitleContext} from './context';

export const ModuleTitleProvider = ({children}: {children: ReactNode}) => {
  const [override, setOverride] = useState<string | null>(null);
  const value = useMemo(() => ({override, setOverride}), [override]);

  return <ModuleTitleContext.Provider value={value}>{children}</ModuleTitleContext.Provider>;
};
