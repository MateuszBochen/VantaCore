import {Route, Routes} from 'react-router-dom';
import UserBadge from './UserBadge.tsx';
import GlobalSearch from './GlobalSearch';
import DashboardPage from './Dashboard/DashboardPage';
import MyTicketsPage from './MyTickets/MyTicketsPage';
import MyWorklogPage from './MyWorklog/MyWorklogPage';
import RoadmapPage from './Roadmap/RoadmapPage';
import AdvancedSearchPage from './Search/AdvancedSearchPage';
import ProjectRoutes from './Project/ProjectRoutes';
import SprintsRoutes from './Sprints/SprintsRoutes';
import UsersRoutes from './Users/UsersRoutes';
import RolesRoutes from './Roles/RolesRoutes';
import ProfilePage from './Profile/ProfilePage';
import ApplicationSettingsPage from './Settings/ApplicationSettingsPage';
import {ModuleTitleProvider, useModuleTitle} from './ModuleTitle';
import {Breadcrumb} from './Breadcrumb';

const WorkPlaceHeader = () => {
  const title = useModuleTitle();

  return (
    // relative z-30 - an explicit stacking context, so UserBadge's dropdown/
    // notification popover always paint above routed page content below it.
    // Without it, page content that also happens to be `position: relative`
    // (every Button, via its ripple/glow effects) could out-paint an
    // unstacked header purely from backdrop-filter compositing quirks - see
    // the "Add user"/per-row "Roles" buttons bleeding through the account
    // dropdown on /users.
    <div className="relative z-30 flex h-18 items-center justify-between border-b border-border bg-card px-4 backdrop-blur-xl">
      <div className="flex min-w-0 flex-col justify-center gap-0.5">
        <Breadcrumb />
        <p className="truncate text-sm font-medium text-muted-foreground">{title}</p>
      </div>

      <div className="flex items-center gap-3">
        <GlobalSearch />
        <UserBadge />
      </div>
    </div>
  );
};

const WorkPlace = () => {
  return (
    <ModuleTitleProvider>
      <main className="flex flex-1 flex-col overflow-hidden">
        <WorkPlaceHeader />
        <div className="flex flex-1 overflow-y-auto p-4">
          <div className="flex h-full w-full rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/my-tickets" element={<MyTicketsPage />} />
              <Route path="/my-worklog" element={<MyWorklogPage />} />
              <Route path="/roadmap" element={<RoadmapPage />} />
              <Route path="/search" element={<AdvancedSearchPage />} />
              <Route path="/projects/*" element={<ProjectRoutes />} />
              <Route path="/sprints/*" element={<SprintsRoutes />} />
              <Route path="/users/*" element={<UsersRoutes />} />
              <Route path="/roles/*" element={<RolesRoutes />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<ApplicationSettingsPage />} />
              <Route
                path="*"
                element={
                  <div className="flex flex-1 items-center justify-center p-6">
                      Workplace
                  </div>
                }
              />
            </Routes>
          </div>
        </div>
      </main>
    </ModuleTitleProvider>
  );
};

export default WorkPlace;
