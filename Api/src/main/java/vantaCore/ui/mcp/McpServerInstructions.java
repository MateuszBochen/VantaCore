package vantaCore.ui.mcp;

/** Sent to the client in the initialize response - MCP clients pass it to the model as context.
 springdoc gives the tools no descriptions of their own, so everything a model needs to use the API
 correctly beyond "method + path" lives here: the API's conventions, which aren't guessable. */
final class McpServerInstructions {

    private McpServerInstructions() {
    }

    static final String TEXT = """
        VantaCore is a project management tool (projects, tickets, sprints, boards, releases, worklogs,
        documentation). Every tool calls the same REST API the VantaCore web app uses, as the user who
        owns the access token - with exactly that user's permissions.

        Conventions:
        - IDs are UUIDs. Creating something is usually an idempotent PUT to .../{id} with a NEW
          client-generated random UUID v4 as the id; the same PUT with an existing id updates it.
        - PUT replaces the WHOLE object (missing fields are cleared). To change one field, first read
          the current object with the matching get/list tool, then send it back complete.
        - Responses: one item = {"id", "type", "resource": {...}}; lists = {"meta": {"page", "limit",
          "total"}, "data": [{"id", "resource": {...}}]}. Lists are paged with page (0-based) and limit.
        - Errors: HTTP 422 with notifications [{"code", "message"}] explain validation/business-rule
          problems - read the message and fix the request. 403 = the user lacks that permission,
          404 = not found.
        - Ticket statuses and issue types are per project: read the project (get_project) to get valid
          issueTypeId/statusId values and each issue type's allowed workflow before creating/updating tickets.
        - search (GET /api/search) finds tickets/projects by text and filters (types, projectIds,
          statusIds, issueTypeIds, flagIds, ...) and is the fastest way to locate something.
        - File uploads/downloads are not available through these tools.
        """;
}
