import {Route, Routes} from 'react-router-dom';
import RolesListPage from './RolesListPage';
import RoleFormPage from './RoleFormPage';

// Owns everything under /roles/* - same convention as UsersRoutes/
// SprintsRoutes.
const RolesRoutes = () => (
  <Routes>
    <Route index element={<RolesListPage />} />
    <Route path="new" element={<RoleFormPage />} />
    <Route path=":roleId/edit" element={<RoleFormPage />} />
  </Routes>
);

export default RolesRoutes;
