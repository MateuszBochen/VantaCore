package vantaCore.application.messageBus;

public class Envelope<T, R> {

    private final T message;
    private R result;

    public Envelope(T message) {
        this.message = message;
    }

    public T getMessage() {
        return message;
    }

    public R getResult() {
        return result;
    }

    public void setResult(R result) {
        this.result = result;
    }
}