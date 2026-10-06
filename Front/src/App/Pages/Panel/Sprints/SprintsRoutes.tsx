import {Route, Routes} from 'react-router-dom';
import BoardsListPage from './BoardsListPage';
import BoardSettingsPage from './BoardSettingsPage';
import BoardPage from './BoardPage';
import SprintFormPage from './SprintFormPage';
import SprintBoardPage from './SprintBoardPage';
import SprintSummaryPage from './SprintSummaryPage';
import SprintComparePage from './SprintComparePage';

// Owns everything under /sprints/* so WorkPlace doesn't need to know about
// the board module's internal routes - same convention as ProjectRoutes.
// Cross-project (see memory: project_vantacore_boards_concept), hence a
// top-level route rather than living under /projects/:id/*.
const SprintsRoutes = () => (
  <Routes>
    <Route index element={<BoardsListPage />} />
    <Route path="new" element={<BoardSettingsPage isNew />} />
    <Route path=":boardId" element={<BoardPage />} />
    <Route path=":boardId/compare" element={<SprintComparePage />} />
    <Route path=":boardId/sprints/new" element={<SprintFormPage />} />
    <Route path=":boardId/sprints/:sprintId/edit" element={<SprintFormPage />} />
    <Route path=":boardId/sprints/:sprintId/summary" element={<SprintSummaryPage />} />
    <Route path=":boardId/sprints/:sprintId" element={<SprintBoardPage />} />
    <Route path=":boardId/settings" element={<BoardSettingsPage />} />
  </Routes>
);

export default SprintsRoutes;
