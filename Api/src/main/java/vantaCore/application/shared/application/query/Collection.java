package vantaCore.application.shared.application.query;

import java.util.List;

public record Collection<T>(int page, long limit, long total, List<Item<T>> data) implements QueryResult {
}
