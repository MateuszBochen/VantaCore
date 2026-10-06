import {createContext, useContext} from 'react';

export type ModuleTitleContextValue = {
  override: string | null;
  setOverride: (title: string | null) => void;
};

export const ModuleTitleContext = createContext<ModuleTitleContextValue | null>(null);

export const useModuleTitleContext = (): ModuleTitleContextValue => {
  const context = useContext(ModuleTitleContext);

  if (!context) {
    throw new Error('useModuleTitle/useSetModuleTitle must be used within a ModuleTitleProvider');
  }

  return context;
};
