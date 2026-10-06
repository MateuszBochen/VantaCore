package vantaCore.application.shared.application.command;

public interface CommandBusInterface {

    public <T> void handle(T command) throws Exception;
}

