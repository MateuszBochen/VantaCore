import useListBoardsHook from '../Board/useListBoardsHook';
import useGetBoardHook from '../Board/useGetBoardHook';
import useListSprintsHook from './useListSprintsHook';
import type {Sprint} from './Type/types';

export type ProjectSprintOption = {
  sprint: Sprint;
  boardName: string;
};

export type ListProjectSprintsResult =
  | {success: true; sprints: ProjectSprintOption[]}
  | {success: false};

// There's no per-project sprint endpoint - Sprints live under Board, and a
// Board can span several projects (see memory: project_vantacore_boards_
// concept) - so this resolves it the same way DashboardPage's own
// active-sprint widget does: list every board, fetch each one's full
// resource (cached, see useGetBoardHook) to read its projectIds, keep only
// the boards this project feeds into, then list sprints for just those.
const useListProjectSprintsHook = () => {
  const {listBoards} = useListBoardsHook();
  const {getBoard} = useGetBoardHook();
  const {listSprints} = useListSprintsHook();

  const listProjectSprints = async (projectId: string): Promise<ListProjectSprintsResult> => {
    const boardsResult = await listBoards();
    if (!boardsResult.success) {
      return {success: false};
    }

    const boards = await Promise.all(boardsResult.boards.map((summary) => getBoard(summary.id)));
    const matchingBoards = boards.flatMap((result) => (result.success && result.board.projectIds.includes(projectId) ? [result.board] : []));

    const sprintLists = await Promise.all(matchingBoards.map((board) => listSprints(board.id).then((result) => ({board, result}))));

    const sprints = sprintLists.flatMap(({board, result}) =>
      result.success ? result.sprints.map((sprint) => ({sprint, boardName: board.name})) : [],
    );

    return {success: true, sprints};
  };

  return {listProjectSprints};
};

export default useListProjectSprintsHook;
