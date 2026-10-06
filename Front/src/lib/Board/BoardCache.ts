import type {Board} from './Type/types';

// Same convention as ProjectCache/TicketCache - one board per id, shared
// across every consumer for the session.
class BoardCache {
    private static instance: BoardCache;

    private readonly boards: Map<string, Board> = new Map();

    static getInstance = (): BoardCache => {
        if (!BoardCache.instance) {
            BoardCache.instance = new BoardCache();
        }

        return BoardCache.instance;
    }

    private constructor() {
    }

    get = (id: string): Board | null => {
        return this.boards.get(id) ?? null;
    }

    set = (board: Board): void => {
        this.boards.set(board.id, board);
    }
}

export default BoardCache;

export const boardCache = BoardCache.getInstance();
