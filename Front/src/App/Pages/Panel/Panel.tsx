import Background from '../../../components/layout/Background.tsx';
import Sidebar from './Sidebar.tsx';
import WorkPlace from './WorkPlace.tsx';
import {useSidebarMenu} from './useSidebarMenu';
import {BreadcrumbProvider} from './Breadcrumb';

const Panel = () => {
  // Built once here (not inside Sidebar) so the same tree can also drive
  // WorkPlaceHeader's breadcrumb (see BreadcrumbProvider) without a second,
  // duplicate round of list/prefetch fetches.
  const menu = useSidebarMenu();

  return (
    <Background>
      <div className="relative z-10 flex h-full w-full">
        <Sidebar menu={menu} />
        <BreadcrumbProvider menu={menu}>
          <WorkPlace />
        </BreadcrumbProvider>
      </div>
    </Background>
  );
};

export default Panel;
