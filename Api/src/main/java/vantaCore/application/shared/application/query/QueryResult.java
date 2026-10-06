package vantaCore.application.shared.application.query;

/**
 * Marker for allowed query handler results - a single Item or a paginated Collection
 */
public sealed interface QueryResult permits Item, Collection {
}