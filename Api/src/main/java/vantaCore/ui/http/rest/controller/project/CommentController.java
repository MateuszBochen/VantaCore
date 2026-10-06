package vantaCore.ui.http.rest.controller.project;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.comment.appliaction.command.addComment.AddCommentCommand;
import vantaCore.application.comment.appliaction.command.deleteComment.DeleteCommentCommand;
import vantaCore.application.comment.appliaction.command.updateComment.UpdateCommentCommand;
import vantaCore.application.comment.appliaction.dto.CommentRequest;
import vantaCore.application.comment.appliaction.query.listComments.CommentResult;
import vantaCore.application.comment.appliaction.query.listComments.ListCommentsQuery;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Empty;
import vantaCore.ui.http.rest.response.dto.Many;

import java.util.UUID;

@RestController
@RequestMapping("/api/project/{projectId}/ticket/{ticketId}/comment")
final public class CommentController {

    private final CommandBusInterface commandBus;
    private final QueryBusInterface queryBus;

    CommentController(CommandBusInterface commandBus, QueryBusInterface queryBus) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }

    @PostMapping
    public OpenApiResponse<Empty> addComment(
        @PathVariable UUID projectId,
        @PathVariable UUID ticketId,
        @RequestBody CommentRequest request
    ) throws Exception {

        this.commandBus.handle(new AddCommentCommand(projectId, ticketId, request));

        return OpenApiResponse.empty(HttpStatus.CREATED);
    }

    @PutMapping("/{commentId}")
    public OpenApiResponse<Empty> updateComment(
        @PathVariable UUID projectId,
        @PathVariable UUID ticketId,
        @PathVariable UUID commentId,
        @RequestBody CommentRequest request
    ) throws Exception {

        this.commandBus.handle(new UpdateCommentCommand(projectId, ticketId, commentId, request));

        return OpenApiResponse.empty(HttpStatus.OK);
    }

    @DeleteMapping("/{commentId}")
    public OpenApiResponse<Empty> deleteComment(
        @PathVariable UUID projectId,
        @PathVariable UUID ticketId,
        @PathVariable UUID commentId
    ) throws Exception {

        this.commandBus.handle(new DeleteCommentCommand(projectId, ticketId, commentId));

        return OpenApiResponse.empty(HttpStatus.OK);
    }

    @GetMapping
    public OpenApiResponse<Many<CommentResult>> listComments(
        @PathVariable UUID projectId,
        @PathVariable UUID ticketId
    ) throws Exception {

        Collection<CommentResult> result = this.queryBus.ask(new ListCommentsQuery(projectId, ticketId));

        return OpenApiResponse.many(result, HttpStatus.OK);
    }
}
