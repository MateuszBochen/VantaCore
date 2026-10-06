package vantaCore.ui.http.rest.controller.board;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.board.appliaction.command.createBoard.CreateBoardCommand;
import vantaCore.application.board.appliaction.command.updateBoard.UpdateBoardCommand;
import vantaCore.application.board.appliaction.dto.CreateBoardRequest;
import vantaCore.application.board.appliaction.query.getBoard.BoardResult;
import vantaCore.application.board.appliaction.query.getBoard.GetBoardQuery;
import vantaCore.application.board.appliaction.query.listBoards.BoardSummaryResult;
import vantaCore.application.board.appliaction.query.listBoards.ListBoardsQuery;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Empty;
import vantaCore.ui.http.rest.response.dto.Many;
import vantaCore.ui.http.rest.response.dto.Single;

import java.util.UUID;

@RestController
@RequestMapping("/api/board")
final public class BoardController {

    private final CommandBusInterface commandBus;
    private final QueryBusInterface queryBus;

    BoardController(CommandBusInterface commandBus, QueryBusInterface queryBus) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }

    @PostMapping
    public OpenApiResponse<Empty> createBoard(
        @RequestBody CreateBoardRequest request
    ) throws Exception {

        this.commandBus.handle(new CreateBoardCommand(request));

        return OpenApiResponse.empty(HttpStatus.CREATED);
    }

    @PutMapping("/{boardId}")
    public OpenApiResponse<Empty> updateBoard(
        @PathVariable UUID boardId,
        @RequestBody CreateBoardRequest request
    ) throws Exception {

        this.commandBus.handle(new UpdateBoardCommand(boardId, request));

        return OpenApiResponse.empty(HttpStatus.OK);
    }

    @GetMapping("/{boardId}")
    public OpenApiResponse<Single<BoardResult>> getBoard(
        @PathVariable UUID boardId
    ) throws Exception {

        Item<BoardResult> result = this.queryBus.ask(new GetBoardQuery(boardId));

        return OpenApiResponse.one(result, HttpStatus.OK);
    }

    @GetMapping
    public OpenApiResponse<Many<BoardSummaryResult>> listBoards() throws Exception {

        Collection<BoardSummaryResult> result = this.queryBus.ask(new ListBoardsQuery());

        return OpenApiResponse.many(result, HttpStatus.OK);
    }
}
