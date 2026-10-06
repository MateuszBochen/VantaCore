import type {EventListener} from './Type/types';

class EventBus {
    private static instance: EventBus;

    private readonly listeners: Map<string, Set<EventListener<unknown>>> = new Map();

    static getInstance = (): EventBus => {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }

        return EventBus.instance;
    }

    private constructor() {
    }

    dispatch = (event: object): void => {
        const eventName = event.constructor.name;
        const eventListeners = this.listeners.get(eventName);

        if (!eventListeners) {
            return;
        }

        eventListeners.forEach((listener) => listener(event));
    }

    subscribe = <TEvent>(eventName: string, listener: EventListener<TEvent>): void => {
        let eventListeners = this.listeners.get(eventName);

        if (!eventListeners) {
            eventListeners = new Set();
            this.listeners.set(eventName, eventListeners);
        }

        eventListeners.add(listener as EventListener<unknown>);
    }

    unsubscribe = <TEvent>(eventName: string, listener: EventListener<TEvent>): void => {
        const eventListeners = this.listeners.get(eventName);

        if (!eventListeners) {
            return;
        }

        eventListeners.delete(listener as EventListener<unknown>);

        if (eventListeners.size === 0) {
            this.listeners.delete(eventName);
        }
    }
}

export default EventBus;

export const eventBus = EventBus.getInstance();
