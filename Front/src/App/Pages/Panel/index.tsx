import {Route, Routes} from 'react-router-dom';
import Panel from './Panel.tsx';

export default function Router () {
  return (
    <Routes>
      <Route path="/*" Component={Panel} />
    </Routes>
  );
};