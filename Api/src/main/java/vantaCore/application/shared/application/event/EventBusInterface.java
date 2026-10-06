package vantaCore.application.shared.application.event;

public interface EventBusInterface {

    /** dispatches to every registered EventHandlerInterface<E> for this event's type, if any */
    <E> void dispatch(E event);
}
