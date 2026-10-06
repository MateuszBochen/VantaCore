package vantaCore.application.shared.domain.specification;

public interface SpecificationInterface<T> {
    public boolean isSatisfied(T entity);
}
