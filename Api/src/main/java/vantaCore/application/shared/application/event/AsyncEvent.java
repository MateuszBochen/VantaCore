package vantaCore.application.shared.application.event;

/** Opt-in routing marker - an event class implementing this is dispatched to a background thread
 pool (see EventAsyncExecutorConfig) instead of EventHandlerMiddleware's default same-thread,
 synchronous dispatch. Same idea as Symfony Messenger's per-message-class transport routing, minus
 the durable-queue part: a routed event just runs its handlers off-thread, nothing survives a
 process crash/restart mid-flight. Fine for a handler that's naturally self-healing/idempotent (e.g.
 a reindex that re-reads current state rather than trusting the event's payload) - not a fit for a
 handler where losing an in-flight event silently would be a real problem. */
public interface AsyncEvent {
}
