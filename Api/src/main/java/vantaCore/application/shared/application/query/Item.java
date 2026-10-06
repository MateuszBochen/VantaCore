package vantaCore.application.shared.application.query;

/**
 * Base item returned to frontend
 */
public record Item<T>(String id, T resource) implements QueryResult
{
    /**
     * Create Item object
     */
    public static <T> Item<T> fromPayload(String id, T payload) {
        return new Item<>(id, payload);
    }
}
