import {Route, Routes} from 'react-router-dom';
import UsersListPage from './UsersListPage';
import UserFormPage from './UserFormPage';

// Owns everything under /users/* - same convention as SprintsRoutes/
// ProjectRoutes. UserFormPage handles both create (isNew) and edit
// (basics + roles, via its own Stepper) - same isNew-prop convention as
// BoardSettingsPage.
const UsersRoutes = () => (
  <Routes>
    <Route index element={<UsersListPage />} />
    <Route path="new" element={<UserFormPage isNew />} />
    <Route path=":userId/edit" element={<UserFormPage />} />
  </Routes>
);

export default UsersRoutes;
