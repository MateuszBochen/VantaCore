import {useEffect} from 'react';
import {useModuleTitleContext} from './context';

// Write side, used by individual pages that have something more specific to
// show (e.g. the actual project name instead of the generic "Project settings").
// Clears itself on unmount/title change so the header can never be left
// showing a title from a page that's no longer mounted.
export const useSetModuleTitle = (title: string | null): void => {
  const {setOverride} = useModuleTitleContext();

  useEffect(() => {
    setOverride(title);
    return () => setOverride(null);
  }, [title, setOverride]);
};
