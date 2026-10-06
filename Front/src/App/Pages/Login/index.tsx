import {Route, Routes} from 'react-router-dom';
import Login from './Login.tsx';
import Register from './Register.tsx';
import SsoCallback from './SsoCallback.tsx';

export default function Router () {
  return (
    <Routes>
      <Route path="/registration" Component={Register} />
      <Route path="/login/sso/:provider" Component={SsoCallback} />
      <Route path="/" Component={Login} />
      <Route path="/*" Component={Login} />
    </Routes>
  );
};
