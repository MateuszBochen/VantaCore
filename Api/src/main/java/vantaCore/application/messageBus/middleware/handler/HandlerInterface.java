package vantaCore.application.messageBus.middleware.handler;

/**
 * Marker interface
 * M - is message type which is handling by handler.
 * R - is handler return type
 */
public interface HandlerInterface<M, R> {
    public R handle(M message);
}
