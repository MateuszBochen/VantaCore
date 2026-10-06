import {useLocation} from 'react-router-dom';
import {useBreadcrumbContext} from './context';
import {decorateActive, findBreadcrumbTrail} from '@/components/PrismMenu';
import type {BreadcrumbSegment} from '@/components/PrismMenu';

// Read side, used by WorkPlaceHeader. A page-published override (see
// useSetBreadcrumb) wins over the default computed from the same PrismMenu
// tree Sidebar renders, walked down to whichever item matches the current
// route - empty for any route that tree doesn't cover at all (Users/Roles/
// Profile/Application settings), which is exactly when a page needs to call
// useSetBreadcrumb itself.
export const useBreadcrumb = (): BreadcrumbSegment[] => {
  const {pathname} = useLocation();
  const {menu, override} = useBreadcrumbContext();

  return override ?? findBreadcrumbTrail(decorateActive(menu, pathname));
};
