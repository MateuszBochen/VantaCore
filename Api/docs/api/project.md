# Project API

Module: `vantaCore.application.project` (domain / appliaction / infrastructure), controller:
`vantaCore.ui.http.rest.controller.project.ProjectController` under `/api/project` (requires auth).

## `PUT /api/project/{id}`

Upsert (create-or-full-replace) of a project's settings skeleton. `id` is generated client-side (UUID)
and is the only required field — a `PUT` with just an id creates an empty/"unusable" project shell that
can be filled in over subsequent `PUT` calls.

- **Semantics: full replace, not merge/patch.** The body always represents the complete desired state.
  Any field omitted from the request is treated as unset (`null`), and `issueTypes` / `automationRules`
  are always the full target list — items are diffed by their client-supplied `id` under the hood
  (`orphanRemoval = true` on the JPA collections), so an item missing from the payload is deleted, not
  left untouched.
- **Uniqueness**: `name` and `prefix` must be unique across all projects, compared case-insensitively
  and trimmed, excluding the project's own id (so re-saving the same project with its own name doesn't
  self-conflict). Enforced in `UpsertProjectPolicy`.
- **Referential integrity** (also `UpsertProjectPolicy`), all violations collected and returned together
  as a `422` with one `Notification` per problem — not fail-fast on the first error:
  - `issueTypes[].initialStatusId` must be a status belonging to that same issue type.
  - `issueTypes[].statuses[].allowedTransitionIds` must reference statuses belonging to that same issue
    type (no cross-type transitions).
  - `issueTypes[].childTypeIds` must reference issue type ids that exist in the same project (a type
    referencing itself, e.g. a `Task` whose child type is `Task`, is valid — recursive subtasks).
  - `automationRules[].parentTypeId` must reference an existing issue type in the project.
  - `automationRules[].setParentStatusId` must be a status belonging to that `parentTypeId`.
- `prefix` format: `^[A-Z][A-Z0-9]{1,9}$` (2-10 chars, uppercase letters/digits, starts with a letter).
- Response: `200 OK`, empty body — the frontend already has the state it just sent (ids are client-side),
  nothing is echoed back.
- **Not yet implemented**: WebSocket broadcast to other connected clients after a save. `WebSocketServer`
  (`vantaCore.ui.http.ws`) is currently a stub with no session registry / send-to-all mechanism — this was
  deliberately deferred to a separate task, not forgotten.

## `GET /api/project/{id}`

Returns the full project. `404` (`ProjectNotFoundException`) if the id doesn't exist.

The response `resource` shape is deliberately a 1:1 mirror of the `PUT` request body (same field names:
`id`, `name`, `prefix`, `startingNumber`, `issueTypes[]` incl. nested `statuses[]`, `automationRules[]`)
so the frontend can round-trip GET → edit → PUT without reshaping data. Wrapped in the standard
`Single<T>` envelope (`{id, type, resource}`).

## `GET /api/project`

Lists all projects, but only `id` + `name` (no nested issue types/statuses — those aggregates have
`fetch = EAGER` collections, so a naive "load every full aggregate" would be an N+1/overfetch trap for a
list endpoint). Implemented via a Spring Data interface projection
(`ProjectIdAndNameProjection`) so the SQL only selects those two columns.

- **Sorted alphabetically by `name`** (`findAllByOrderByNameAsc` → `ORDER BY name ASC` in the DB).
  Projects without a name yet (shells) sort last (`NULLS LAST`, Postgres default for `ASC`).
- No pagination yet — response `Many<T>` envelope currently reports `page = 0`, `limit = total`. Add real
  paging here if the project list grows large enough to matter.

## Open items / deliberate deferrals

- WebSocket broadcast on save (see above).
- Optimistic locking / concurrent-edit protection — not implemented. Two admins editing project settings
  at the same time will silently overwrite each other (last `PUT` wins). Not a problem yet with a single
  admin user, revisit if multi-admin editing becomes real.
- No dependency check yet between project settings and actual tickets/issues (that aggregate doesn't
  exist in the backend yet) — e.g. nothing stops you from deleting a status or issue type that tickets
  already reference, because no tickets exist yet to reference them.
