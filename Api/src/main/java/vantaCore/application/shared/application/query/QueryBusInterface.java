package vantaCore.application.shared.application.query;

public interface QueryBusInterface {

    <T, R> R ask(T query) throws Exception;
}