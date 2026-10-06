import {useLocation} from 'react-router-dom';
import {useModuleTitleContext} from './context';
import {routeTitle} from './rules';

// Read side, used by the header. A page-published override wins over the
// static route rule; falls back to the route rule when nothing is published.
export const useModuleTitle = (): string | null => {
  const {pathname} = useLocation();
  const {override} = useModuleTitleContext();

  return override ?? routeTitle(pathname);
};
