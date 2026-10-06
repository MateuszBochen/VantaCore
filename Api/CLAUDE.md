# VantaCore API — architecture guide

Spring Boot 3.3.4 / Java 21 backend. Package root: `vantaCore`. DDD-flavored CQRS: writes go through a
command bus, reads/anything-returning-data go through a query bus. Both buses are custom (not a library),
built on a shared middleware pipeline in `vantaCore.application.messageBus`.

Note the existing package name `appliaction` (typo) under each module, e.g.
`vantaCore.application.user.appliaction.*`. It's already used throughout the codebase — keep using it for
new files in that module instead of "fixing" it to `application`, unless you deliberately do a full rename.

## Guiding principles: hexagonal architecture + DDD

We follow **hexagonal architecture (ports & adapters)** and try to apply **DDD** as consistently as
practical. In practice that means, per module:

- `domain` is the core/hexagon — aggregates, value objects, policies, specifications, and repository
  **interfaces** (the ports). It must not depend on Spring web, JPA, or any other delivery/persistence
  framework detail. Business rules live here, not in handlers or controllers.
- `infrastructure` holds the **adapters** implementing those domain ports — JPA entities, repository
  adapters, anything talking to an external system (DB, ES, etc.). It depends on `domain`, never the other
  way around.
- `appliaction` is the application/orchestration layer — commands, queries, and their handlers. Handlers
  orchestrate domain objects (aggregates, policies, specifications) through the ports; they shouldn't contain
  business rules themselves, just coordination.
- `ui/http` is another adapter (the driving side) — controllers translate HTTP requests into
  commands/queries and translate results back into HTTP responses. No business logic here either.

When adding something new, ask "is this a business rule (→ domain), an orchestration step (→ appliaction),
or a technical detail of talking to the outside world (→ infrastructure/ui)?" and place it accordingly,
rather than putting logic directly in a controller or a JPA entity.

## Module layout

Each business module (e.g. `user`) is split into:

- `domain` — aggregates, value objects, policies, specifications, repository interfaces. No Spring/JPA/HTTP
  imports here except plain `@Component` on policies/specifications for DI.
- `appliaction` — commands/queries, their handlers, and REST-facing request DTOs (`dto` package).
- `infrastructure` — JPA entities + repository adapters implementing the domain repository interface.

REST controllers live outside the module, under `vantaCore.ui.http.rest.controller.<area>`.

## Command bus vs query bus

- **Command** = write, no meaningful return value.
  - `CommandHandlerInterface<C> extends HandlerInterface<C, Void>`
  - Dispatched via `CommandBusInterface.handle(command)` (returns `void`, result is discarded even if the
    handler produced one — don't rely on a command returning data).
  - Example: `CreateAdminCommand` / `CreateAdminCommandHandler`.
- **Query** = anything that returns data (reads, but also things like login that don't mutate an aggregate
  but need to hand back a result).
  - `QueryHandlerInterface<Q, R extends QueryResult>` — **R is constrained by the compiler** to
    `vantaCore.application.shared.application.query.Item<T>` or `Collection<T>` (a sealed interface,
    `QueryResult`, permits only those two). A query handler that tries to return a raw DTO won't compile.
  - Wrap the result **inside the handler**, not in the controller:
    ```java
    return Item.fromPayload(someId, someResult);
    ```
  - Dispatched via `QueryBusInterface.ask(query)` (returns `R`).
  - Example: `LoginQuery` / `LoginQueryHandler` → `Item<LoginResult>`.

Both buses are built the same way: a list of Spring-injected middlewares (marker interfaces
`CommandMiddlewareInterface` / `QueryMiddlewareInterface`, both extending `MiddlewareInterface`) plus a list
of handlers, assembled by `MessageBusFactory` into a `MessageBus`. `HandlerMiddleware` is always appended
last and dispatches to the handler matching the message's runtime class (via reflection over the handler's
generic interface — one handler per message type).

`ValidationMiddleware` implements **both** middleware marker interfaces so it runs on every command and
every query. It runs jakarta `Validator` against the message object, so `@Valid @NotNull` on the wrapped
request field (see below) is what actually triggers bean validation.

## Command/Query message shape

A command or query is a thin wrapper around the REST request DTO, always validated with `@Valid @NotNull`:

```java
final public class CreateAdminCommand {
    @Valid
    @NotNull
    private final CreateAdminRequest createAdminRequest;
    ...
}
```

Follow this shape for new commands/queries — don't put `@NotBlank` etc. directly on the command; put it on
the nested request DTO and cascade with `@Valid`.

## Cross-module communication

When a command handler in one module needs to trigger behavior in **another** module (a side effect,
not just a read), don't inject that other module's repository/service/aggregate directly. Publish a
domain event instead, and let an event handler living in the *owning* module react to it.

- **Event bus** — a third bus (`EventBusInterface.dispatch(event)`), structurally identical to
  Command/QueryBus (same `Envelope`/`MiddlewareStack`/marker-interface pipeline via
  `EventMiddlewareInterface`), but its terminal stage (`EventHandlerMiddleware`) is fan-out: any number
  of `EventHandlerInterface<E>` beans can react to the same event type, unlike `HandlerMiddleware`
  (exactly one handler per command/query type). `dispatch` has no `throws Exception` — it's called from
  inside a `handle()` method that itself can't declare one, so the underlying checked exception is
  wrapped once inside `EventBus`, not at every call site.
- **Event classes** live in the *publishing* module's `domain.event` package (e.g.
  `vantaCore.application.worklog.domain.event.TicketTimeWasLogged`) — they're the module's public,
  depended-upon surface for cross-module communication, unlike its repositories/aggregates.
- **Event handlers** live in the *reacting* module's `appliaction.eventHandler` package, named
  `DoSomethingWhenXWasY` (e.g. `PropagateTimeSpentWhenTicketTimeWasLogged`,
  `CreateNotificationWhenNewTicketWasCreated`). A handler that needs to cause a further write dispatches
  its own module's command via `CommandBusInterface` — it doesn't call a repository/service directly
  either, to keep "how do I mutate this module's state" answerable only through that module's own
  commands.
- **Circular-dependency gotcha**: `CommandBus`/`EventBus` each eagerly collect their *entire* handler
  list in the constructor. If an `EventHandlerInterface` needs `CommandBusInterface` (to dispatch a
  command in reaction to an event), inject it as `@Lazy CommandBusInterface` — otherwise you get a
  genuine Spring construction-time cycle (`CommandBus` → a command handler that needs `EventBus` →
  `EventBus` → this event handler → `CommandBus` again). See
  `PropagateTimeSpentWhenTicketTimeWasLogged` for the pattern.
- **Exception — read-only lookups stay direct.** A handler needing to load/validate against another
  module's data *synchronously* (e.g. `UpsertTicketCommandHandler` loading the owning `ProjectAggregate`
  to validate `issueTypeId`/`statusId`, or returning a 404 before an HTTP response can be sent) keeps a
  direct dependency on that module's repository interface. An async event can't answer a question the
  caller needs answered in the same request — this rule is about avoiding direct **write-side effects**
  across modules, not about eliminating every cross-module read.

## Domain building blocks

- **Aggregate** (e.g. `UserAggregate`) — plain object composed of value objects + a `Set<Role>`. No setters;
  rebuilt from scratch on every load/save via the repository adapter's `toDomain()`/`fromDomain()`.
- **Value Object**:
  - Simple validation-only VOs are Java `record`s with checks in the compact constructor (`Email`, `UserId`).
  - VOs with extra invariants (e.g. `Password`, which must never re-hash an already-hashed value) use a
    private constructor + named static factories instead of a public constructor —
    `Password.fromRaw(raw)` when creating from user input, `Password.fromHash(hash)` when rehydrating from
    the database. **Never add a public `new Password(x)` back** — that's exactly the double-hashing bug
    that was fixed once already.
- **Policy** — `PolicyInterface<T> { NotificationCollection check(T value); }`. Business-rule checks that
  can block an operation. Call `.assertAllowed()` on the result to throw `UnprocessableEntityException` if
  any notification is blocking. Used inside a command/query handler before mutating state.
- **Specification** — `SpecificationInterface<T> { boolean isSatisfied(T value); }`. A single boolean
  predicate over the domain (e.g. `UniqueEmailSpecification`), typically consumed by a policy.

## Error handling

- `ClientException` (abstract `RuntimeException`) carries a `List<Notification>` and an abstract
  `getStatus()`. Subclass it for every distinct client-facing error:
  - `UnprocessableEntityException` (422) — thrown by `NotificationCollection.assertAllowed()`, used for
    validation/business-rule failures.
  - `AuthenticationFailedException` / `InvalidTokenException` (401) — auth-specific failures.
- `RestExceptionHandler` (`@RestControllerAdvice`) catches `ClientException` and formats its notifications
  into a `Collection<Notification>` response with the exception's own status; anything else falls through
  to a generic 500 handler (stack trace only included when the `dev` profile is active).
- `TransactionMiddleware` exists in `shared/infrastructure/middleware` but is **not currently registered as
  a Spring bean** (no `@Component`/`@Service`, nothing constructs it) — command/query handlers do not
  actually run inside a transaction today. If you need transactional handling, register it explicitly rather
  than assuming it's already wired in.

## REST/response layer

- Controllers stay thin: build the Command/Query from the request DTO, dispatch it, wrap the result.
- `CommandBusInterface.handle(cmd)` → `void` → typically `OpenApiResponse.empty(HttpStatus.CREATED)`.
- `QueryBusInterface.ask(query)` → already an `Item<T>`/`Collection<T>` (per the handler contract above) →
  pass straight into `OpenApiResponse.one(item, status)` / `OpenApiResponse.many(collection, status)`.

## Security

- `/web-api/**` is the public prefix — permitAll, used for anything that must work without a token (login,
  admin bootstrap). `/api/**` requires authentication.
- `JwtAuthenticationFilter` reads `Authorization: Bearer <token>`, and on a valid token sets a
  `SecurityContext` authentication with authorities `ROLE_<Role>` per claim. Invalid/missing token just
  means no authentication is set — Spring Security's `authenticated()` rule on `/api/**` is what actually
  rejects the request, not the filter itself.
- `JwtService` is the single place that creates/parses/refreshes tokens — don't hand-roll `Jwts.builder()`
  calls elsewhere.
- Session is stateless (`SessionCreationPolicy.STATELESS`) — don't reach for `HttpSession`.

## Adding a new feature — checklist

**Command (write, no return value):**
1. Request DTO in `appliaction/dto` with bean-validation annotations.
2. `XxxCommand` wrapping the DTO with `@Valid @NotNull`.
3. `XxxCommandHandler implements CommandHandlerInterface<XxxCommand>`, `@Component`.
4. Controller under `ui/http/rest/controller/<area>`, dispatch via `CommandBusInterface`.

**Query (returns data):**
1. Request DTO (if any input) in `appliaction/dto`.
2. `XxxQuery` wrapping the DTO with `@Valid @NotNull` (or empty if no input).
3. `XxxQueryHandler implements QueryHandlerInterface<XxxQuery, Item<XxxResult>>` (or `Collection<...>` for
   lists), `@Component`. Wrap the return value with `Item.fromPayload(id, result)` inside the handler.
4. Controller under `ui/http/rest/controller/<area>`, dispatch via `QueryBusInterface.ask(...)` and pass the
   result straight to `OpenApiResponse.one(...)`/`many(...)`.