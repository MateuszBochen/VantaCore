package vantaCore.application.messageBus;

public interface MessageBusInterface {
    <M, R> Envelope<M, R> dispatch(M message) throws Exception;
}

