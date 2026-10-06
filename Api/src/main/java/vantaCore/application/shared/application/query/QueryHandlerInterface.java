package vantaCore.application.shared.application.query;

import vantaCore.application.messageBus.middleware.handler.HandlerInterface;

/**
 * Q - query name
 * R - query result, must be Item<T> or Collection<T>
 */
public interface QueryHandlerInterface<Q, R extends QueryResult> extends HandlerInterface<Q, R> {
}