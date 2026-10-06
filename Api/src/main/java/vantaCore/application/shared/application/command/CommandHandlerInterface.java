package vantaCore.application.shared.application.command;

import org.springframework.stereotype.Service;
import vantaCore.application.messageBus.middleware.handler.HandlerInterface;

/**
 * C - command name
 */
public interface CommandHandlerInterface<C> extends HandlerInterface<C, Void> {
}
